import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '$lib/api/client';
import type { ParticipantEvent } from '$lib/api/contracts';
import {
	EVENT_BATCH_SIZE,
	EVENT_OUTBOX_MAX,
	EVENT_RETRY_MIN_MS,
	EVENT_SEND_DELAY_MS
} from '$lib/config';
import { randomUuid } from '$lib/utils/uuid';
import { EventOutbox } from './eventOutbox';

const ID = '6f1c1f2e-1a2b-4c3d-8e9f-0a1b2c3d4e5f';

function memoryStorage(): Storage {
	const items = new Map<string, string>();
	return {
		get length() {
			return items.size;
		},
		clear: () => items.clear(),
		getItem: (key) => items.get(key) ?? null,
		key: (index) => [...items.keys()][index] ?? null,
		removeItem: (key) => void items.delete(key),
		setItem: (key, value) => void items.set(key, value)
	};
}

describe('EventOutbox', () => {
	let storage: Storage;
	let sent: ParticipantEvent[][];
	let send: ReturnType<typeof vi.fn<(events: ParticipantEvent[]) => Promise<void>>>;

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-10-19T10:00:00Z'));
		storage = memoryStorage();
		sent = [];
		send = vi.fn(async (events: ParticipantEvent[]) => void sent.push(events));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('times a moment when it happens and sends it a little later', async () => {
		const outbox = new EventOutbox({ storage, send });
		outbox.log(ID, 'opened');
		expect(send).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(EVENT_SEND_DELAY_MS);
		expect(sent).toEqual([
			[{ participantId: ID, kind: 'opened', at: Date.parse('2026-10-19T10:00:00Z') }]
		]);
		expect(outbox.pending).toBe(0);
	});

	it('sends moments close together in one request', async () => {
		const outbox = new EventOutbox({ storage, send });
		outbox.log(ID, 'finished');
		await vi.advanceTimersByTimeAsync(1_000);
		outbox.log(ID, 'pdf_download');

		await vi.advanceTimersByTimeAsync(EVENT_SEND_DELAY_MS);
		expect(send).toHaveBeenCalledTimes(1);
		expect(sent[0]?.map((e) => e.kind)).toEqual(['finished', 'pdf_download']);
	});

	it('notes a moment of a participant only once', async () => {
		const outbox = new EventOutbox({ storage, send });
		outbox.log(ID, 'finished');
		outbox.log(ID, 'finished');
		expect(outbox.pending).toBe(1);
	});

	it('keeps the moments when the wifi drops, and retries with a growing pause', async () => {
		send.mockRejectedValue(new TypeError('Failed to fetch'));
		const outbox = new EventOutbox({ storage, send });
		outbox.log(ID, 'opened');

		await vi.advanceTimersByTimeAsync(EVENT_SEND_DELAY_MS);
		expect(send).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(EVENT_RETRY_MIN_MS);
		expect(send).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(EVENT_RETRY_MIN_MS);
		expect(send).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(EVENT_RETRY_MIN_MS);
		expect(send).toHaveBeenCalledTimes(3);

		send.mockImplementation(async (events) => void sent.push(events));
		await vi.advanceTimersByTimeAsync(4 * EVENT_RETRY_MIN_MS);
		expect(outbox.pending).toBe(0);
	});

	it('does not cut a retry pause short for a new moment', async () => {
		send.mockRejectedValueOnce(new ApiError(503, 'unavailable'));
		const outbox = new EventOutbox({ storage, send });
		outbox.log(ID, 'finished');
		await vi.advanceTimersByTimeAsync(EVENT_SEND_DELAY_MS);

		outbox.log(ID, 'pdf_download');
		await vi.advanceTimersByTimeAsync(EVENT_SEND_DELAY_MS);
		expect(send).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(EVENT_RETRY_MIN_MS);
		expect(sent[0]?.map((e) => e.kind)).toEqual(['finished', 'pdf_download']);
	});

	it('drops moments the server refuses, so they cannot hold up the rest', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		send.mockRejectedValueOnce(new ApiError(400, 'invalid'));
		const outbox = new EventOutbox({ storage, send });
		outbox.log(ID, 'opened');
		await vi.advanceTimersByTimeAsync(EVENT_SEND_DELAY_MS);
		expect(outbox.pending).toBe(0);
	});

	it('survives a reload, and leaves out anything stored that does not look valid', () => {
		send.mockReturnValue(new Promise(() => {}));
		new EventOutbox({ storage, send }).log(ID, 'opened');
		const stored = JSON.parse(storage.getItem('fairness-demo:event-outbox') ?? '[]') as unknown[];
		storage.setItem(
			'fairness-demo:event-outbox',
			JSON.stringify([...stored, { participantId: 'x', kind: 'opened', at: 1 }, { kind: 'nap' }])
		);

		expect(new EventOutbox({ storage, send }).pending).toBe(1);
	});

	it('sends a long backlog in batches and keeps only the newest moments', async () => {
		const outbox = new EventOutbox({ storage, send });
		for (let i = 0; i < EVENT_OUTBOX_MAX + 5; i++) outbox.log(randomUuid(), 'opened');
		expect(outbox.pending).toBe(EVENT_OUTBOX_MAX);

		await outbox.flush();
		expect(send).toHaveBeenCalledTimes(Math.ceil(EVENT_OUTBOX_MAX / EVENT_BATCH_SIZE));
		expect(sent.every((batch) => batch.length <= EVENT_BATCH_SIZE)).toBe(true);
	});
});
