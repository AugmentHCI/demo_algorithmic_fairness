import { isTransient, sendParticipantEvents } from '$lib/api/client';
import type { ParticipantEvent } from '$lib/api/contracts';
import {
	EVENT_BATCH_SIZE,
	EVENT_OUTBOX_MAX,
	EVENT_RETRY_MAX_MS,
	EVENT_RETRY_MIN_MS,
	EVENT_SEND_DELAY_MS
} from '$lib/config';
import { isParticipantEventKind, type ParticipantEventKind } from '$lib/domain/types';
import { isUuid } from '$lib/utils/uuid';

/**
 * Moments of the participants' runs on this phone (opened the demo, reached
 * the end, downloaded the PDF) on their way to the server, for the analysis
 * after an event. Built to stay out of the way on venue wifi:
 *
 * - a moment is timed by the phone the instant it happens and kept in
 *   localStorage, so a late send, a reload or a later visit loses nothing;
 * - it is sent a few seconds later, so it never competes with the demo's own
 *   requests, and moments close together share one request;
 * - when the wifi drops, the outbox waits longer and longer before trying
 *   again, and tries right away once the phone is back online or put away.
 *
 * The server keeps each moment of a participant once, so a repeat is harmless.
 */

const STORAGE_KEY = 'fairness-demo:event-outbox';

type Send = (events: ParticipantEvent[]) => Promise<void>;

export class EventOutbox {
	#queue: ParticipantEvent[];
	readonly #storage: Storage | undefined;
	readonly #send: Send;
	#sending = false;
	#timer: ReturnType<typeof setTimeout> | undefined;
	#retryDelay = EVENT_RETRY_MIN_MS;

	constructor({
		storage = safeLocalStorage(),
		send = (events) => sendParticipantEvents({ events })
	}: { storage?: Storage; send?: Send } = {}) {
		this.#storage = storage;
		this.#send = send;
		this.#queue = loadQueue(storage);
	}

	/** Moments not confirmed by the server yet. */
	get pending(): number {
		return this.#queue.length;
	}

	/** Note that `kind` happens now to this participant. Never throws, never waits. */
	log(participantId: string, kind: ParticipantEventKind): void {
		if (this.#queue.some((e) => e.participantId === participantId && e.kind === kind)) return;
		this.#queue.push({ participantId, kind, at: Date.now() });
		if (this.#queue.length > EVENT_OUTBOX_MAX) this.#queue.splice(0, 1);
		this.#persist();
		// A send already planned (also a retry's pause) takes this moment along.
		if (this.#timer === undefined) this.#schedule(EVENT_SEND_DELAY_MS);
	}

	/** Starts sending, including moments left over from a previous visit. Returns the cleanup. */
	start(): () => void {
		const retryNow = () => {
			this.#retryDelay = EVENT_RETRY_MIN_MS;
			void this.flush();
		};
		// Put away or closed: send now, `keepalive` lets the request finish.
		const sendWhenHidden = () => {
			if (document.visibilityState === 'hidden') void this.flush();
		};
		window.addEventListener('online', retryNow);
		document.addEventListener('visibilitychange', sendWhenHidden);
		if (this.#queue.length > 0) this.#schedule(EVENT_SEND_DELAY_MS);
		return () => {
			clearTimeout(this.#timer);
			this.#timer = undefined;
			window.removeEventListener('online', retryNow);
			document.removeEventListener('visibilitychange', sendWhenHidden);
		};
	}

	/** Send everything now, one batch at a time, oldest first. */
	async flush(): Promise<void> {
		clearTimeout(this.#timer);
		this.#timer = undefined;
		if (this.#sending) return;
		this.#sending = true;
		try {
			while (this.#queue.length > 0) {
				const batch = this.#queue.slice(0, EVENT_BATCH_SIZE);
				try {
					await this.#send(batch);
				} catch (error) {
					if (isTransient(error)) {
						this.#schedule(this.#retryDelay);
						this.#retryDelay = Math.min(this.#retryDelay * 2, EVENT_RETRY_MAX_MS);
						return;
					}
					// Never accepted (e.g. stored by an older version): drop it, so it
					// cannot hold up the moments behind it.
					console.error('[events] Dropping events the server rejected', batch, error);
				}
				this.#queue = this.#queue.filter((event) => !batch.includes(event));
				this.#persist();
				this.#retryDelay = EVENT_RETRY_MIN_MS;
			}
		} finally {
			this.#sending = false;
		}
	}

	#schedule(ms: number): void {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => void this.flush(), ms);
	}

	#persist(): void {
		try {
			this.#storage?.setItem(STORAGE_KEY, JSON.stringify(this.#queue));
		} catch {
			// Storage unavailable or full: the moments are still sent, they just won't survive a reload.
		}
	}
}

let shared: EventOutbox | undefined;

/** The page's event outbox, created on first use; `undefined` outside the browser. */
export function eventOutbox(): EventOutbox | undefined {
	if (typeof window === 'undefined') return undefined;
	return (shared ??= new EventOutbox());
}

function loadQueue(storage: Storage | undefined): ParticipantEvent[] {
	try {
		const parsed: unknown = JSON.parse(storage?.getItem(STORAGE_KEY) ?? '[]');
		return Array.isArray(parsed) ? parsed.filter(isParticipantEvent).slice(-EVENT_OUTBOX_MAX) : [];
	} catch {
		return [];
	}
}

function isParticipantEvent(value: unknown): value is ParticipantEvent {
	if (typeof value !== 'object' || value === null) return false;
	const event = value as Record<string, unknown>;
	return (
		isUuid(event.participantId) &&
		isParticipantEventKind(event.kind) &&
		Number.isSafeInteger(event.at) &&
		(event.at as number) > 0
	);
}

function safeLocalStorage(): Storage | undefined {
	try {
		return typeof window === 'undefined' ? undefined : window.localStorage;
	} catch {
		return undefined;
	}
}
