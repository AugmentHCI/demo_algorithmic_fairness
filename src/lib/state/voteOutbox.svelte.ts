import { ApiError, isTransient, sendVote } from '$lib/api/client';
import type { VoteIngest } from '$lib/api/contracts';
import { TABLET_RETRY_MAX_MS, TABLET_RETRY_MIN_MS } from '$lib/config';
import { isRuleId, isVoteChoice } from '$lib/domain/types';
import { randomUuid } from '$lib/utils/uuid';

/**
 * The votes of one tablet on their way to the server. A tap lands here first
 * (and in localStorage, so it survives a reload or a flat battery), then the
 * votes are sent one by one, in order. When the wifi drops, the outbox keeps
 * them and tries again with a growing delay. Every vote carries its own id, so
 * a retry after a lost response is still counted only once.
 */

const STORAGE_KEY = 'fairness-demo:tablet-outbox';

type QueuedVote = VoteIngest & { readonly id: string };

/**
 * - `ok`: everything sent, or sending right now;
 * - `retrying`: the server could not be reached, votes are kept and retried
 *   (silently: participants only ever see that their vote counted);
 * - `unauthorized`: the server refused this tablet's key, votes are kept.
 */
export type OutboxStatus = 'ok' | 'retrying' | 'unauthorized';

export class VoteOutbox {
	#queue = $state<QueuedVote[]>([]);
	status = $state<OutboxStatus>('ok');
	/** Votes not confirmed by the server yet. */
	readonly pending = $derived(this.#queue.length);

	/** The key sent with every vote. */
	readonly token: string;
	#sending = false;
	#stopped = false;
	#retryDelay = TABLET_RETRY_MIN_MS;
	#retryTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(token: string) {
		this.token = token;
		this.#queue = loadQueue();
	}

	add(vote: Omit<VoteIngest, 'id'>): void {
		this.#queue.push({ ...vote, id: randomUuid() });
		this.#persist();
		// A fresh tap is a good moment to try again, even while waiting for a retry.
		this.#retryDelay = TABLET_RETRY_MIN_MS;
		void this.#flush();
	}

	/** Starts sending, including votes left over from a previous visit. Returns the cleanup. */
	start(): () => void {
		const retryNow = () => {
			this.#retryDelay = TABLET_RETRY_MIN_MS;
			void this.#flush();
		};
		// A tablet that slept may have missed its retry timer: try again when it wakes up.
		const retryWhenVisible = () => {
			if (document.visibilityState === 'visible') retryNow();
		};
		window.addEventListener('online', retryNow);
		document.addEventListener('visibilitychange', retryWhenVisible);
		void this.#flush();
		return () => {
			this.#stopped = true;
			clearTimeout(this.#retryTimer);
			window.removeEventListener('online', retryNow);
			document.removeEventListener('visibilitychange', retryWhenVisible);
		};
	}

	async #flush(): Promise<void> {
		if (this.#sending || this.#stopped) return;
		clearTimeout(this.#retryTimer);
		this.#sending = true;
		try {
			while (!this.#stopped) {
				const vote = this.#queue[0];
				if (!vote) break;
				try {
					await sendVote($state.snapshot(vote), this.token);
				} catch (error) {
					if (error instanceof ApiError && error.status === 401) {
						this.status = 'unauthorized';
						return;
					}
					if (isTransient(error)) {
						console.warn(`[tablet] Vote not sent yet, retrying in ${this.#retryDelay} ms`, error);
						this.status = 'retrying';
						this.#scheduleRetry();
						return;
					}
					// Never accepted (e.g. a vote stored by an older version): drop it, so it
					// cannot hold up the votes behind it.
					console.error('[tablet] Dropping a vote the server rejected', vote, error);
				}
				this.#queue.shift();
				this.#persist();
				this.status = 'ok';
				this.#retryDelay = TABLET_RETRY_MIN_MS;
			}
		} finally {
			this.#sending = false;
		}
	}

	#scheduleRetry(): void {
		this.#retryTimer = setTimeout(() => void this.#flush(), this.#retryDelay);
		this.#retryDelay = Math.min(this.#retryDelay * 2, TABLET_RETRY_MAX_MS);
	}

	#persist(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#queue));
		} catch {
			// Storage unavailable or full: the votes are still sent, they just won't survive a reload.
		}
	}
}

function loadQueue(): QueuedVote[] {
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
		return Array.isArray(parsed) ? parsed.filter(isQueuedVote) : [];
	} catch {
		return [];
	}
}

function isQueuedVote(value: unknown): value is QueuedVote {
	if (typeof value !== 'object' || value === null) return false;
	const vote = value as Record<string, unknown>;
	return (
		typeof vote.id === 'string' &&
		isRuleId(vote.rule) &&
		isVoteChoice(vote.choice) &&
		(vote.station === undefined || typeof vote.station === 'string')
	);
}
