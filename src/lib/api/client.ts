import { API_TIMEOUT_MS } from '$lib/config';
import type { RuleId } from '$lib/domain/types';
import type {
	Arrival,
	ParticipantEvents,
	ParticipantVote,
	PersonaRequest,
	PersonaResponse,
	PersonaReturn,
	RankingSubmission,
	RankingSummary,
	VoteIngest,
	VoteSummary
} from './contracts';

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'ApiError';
	}
}

interface RequestOptions {
	readonly method?: 'GET' | 'POST';
	readonly body?: unknown;
	readonly headers?: Readonly<Record<string, string>>;
	readonly signal?: AbortSignal;
	/** Extra attempts after network errors or 5xx responses. */
	readonly retries?: number;
	/** Let the request finish even when the page is closed or put away. */
	readonly keepalive?: boolean;
}

/**
 * Worth another try: no answer at all (wifi, timeout), a server error, or the
 * server asking to come back later. Any other refusal will never change.
 */
export function isTransient(error: unknown): boolean {
	if (!(error instanceof ApiError)) return true;
	return error.status >= 500 || error.status === 408 || error.status === 429;
}

/**
 * Small fetch wrapper for our own API: JSON in/out, a hard timeout, and a
 * short retry for flaky venue wifi.
 */
async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', body, headers, signal, retries = 1, keepalive } = options;

	for (let attempt = 0; ; attempt++) {
		const { signal: combined, release } = withTimeout(API_TIMEOUT_MS, signal);
		try {
			const response = await fetch(path, {
				method,
				headers: {
					...headers,
					...(body === undefined ? {} : { 'content-type': 'application/json' })
				},
				body: body === undefined ? undefined : JSON.stringify(body),
				signal: combined,
				keepalive
			});
			if (!response.ok)
				throw new ApiError(response.status, `${method} ${path} → ${response.status}`);
			return (await response.json()) as T;
		} catch (error) {
			const retryable =
				!signal?.aborted &&
				attempt < retries &&
				(!(error instanceof ApiError) || error.status >= 500);
			if (!retryable) throw error;
			await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
		} finally {
			release();
		}
	}
}

/**
 * A signal that aborts after `ms`, or as soon as `outer` does. Built by hand:
 * `AbortSignal.timeout` and `AbortSignal.any` are missing on older tablets
 * (e.g. Safari before 16), where calling them would fail every request.
 * Call `release` once the request is done.
 */
function withTimeout(
	ms: number,
	outer?: AbortSignal
): { signal: AbortSignal; release: () => void } {
	const controller = new AbortController();
	const abort = () => controller.abort();
	const timer = setTimeout(abort, ms);
	if (outer?.aborted) abort();
	else outer?.addEventListener('abort', abort, { once: true });
	return {
		signal: controller.signal,
		release: () => {
			clearTimeout(timer);
			outer?.removeEventListener('abort', abort);
		}
	};
}

/** Take a persona of the participant's block out of the persona box; asking again keeps it. */
export function takePersona(request: PersonaRequest): Promise<PersonaResponse> {
	return requestJson<PersonaResponse>('/api/persona', {
		method: 'POST',
		body: request,
		retries: 2
	});
}

/** Put the participant's persona back in the box; repeats are harmless. */
export async function returnPersona(request: PersonaReturn): Promise<void> {
	await requestJson<unknown>('/api/persona/return', { method: 'POST', body: request, retries: 2 });
}

export function fetchVoteSummary(rule: RuleId, signal?: AbortSignal): Promise<VoteSummary> {
	return requestJson<VoteSummary>(`/api/votes?rule=${encodeURIComponent(rule)}`, {
		signal,
		retries: 0
	});
}

export function fetchRankingSummary(signal?: AbortSignal): Promise<RankingSummary> {
	return requestJson<RankingSummary>('/api/rankings', { signal, retries: 0 });
}

export async function submitRanking(submission: RankingSubmission): Promise<void> {
	await requestJson<unknown>('/api/rankings', { method: 'POST', body: submission, retries: 2 });
}

/**
 * Store one tablet vote. No retries here: the tablet's outbox decides when to
 * try again, and the vote's `id` makes a repeated attempt harmless.
 */
export async function sendVote(vote: VoteIngest, token: string): Promise<void> {
	await requestJson<unknown>('/api/votes', {
		method: 'POST',
		body: vote,
		headers: { authorization: `Bearer ${token}` },
		retries: 0
	});
}

/**
 * Check a vote tablet's password before remembering it. Resolves when it is
 * right; rejects with a 401 `ApiError` when it is wrong, and
 * with another error when the server cannot be reached.
 */
export async function checkTabletPassword(password: string): Promise<void> {
	await requestJson<unknown>('/api/tablet-password', {
		method: 'POST',
		headers: { authorization: `Bearer ${password}` },
		retries: 0
	});
}

/** Store a vote cast in the app (solo version); voting again in a round changes the vote. */
export async function castVote(vote: ParticipantVote): Promise<void> {
	await requestJson<unknown>('/api/participant-votes', { method: 'POST', body: vote, retries: 2 });
}

/** Tell the server the participant reached a round's vote screen; repeats are harmless. */
export async function reportArrival(arrival: Arrival): Promise<void> {
	await requestJson<unknown>('/api/arrivals', { method: 'POST', body: arrival, retries: 2 });
}

/**
 * Store moments of participants' runs. No retries here: the event outbox
 * decides when to try again, and the server keeps each moment only once.
 */
export async function sendParticipantEvents(body: ParticipantEvents): Promise<void> {
	await requestJson<unknown>('/api/events', { method: 'POST', body, retries: 0, keepalive: true });
}
