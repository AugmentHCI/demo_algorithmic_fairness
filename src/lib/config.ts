import type { ThermometerId } from '$lib/domain/types';

/** Number of candidates invited for an interview ("de top 6 mag op gesprek"). */
export const INTERVIEW_SLOTS = 6;

/**
 * On "het hoekje waar niemand keek", every applicant stands for this many
 * people, so the 20 CVs become a crowd of 100 with exactly the same shares.
 */
export const CROWD_FACTOR = 5;

/**
 * How long a participant holds their persona. A phone that never reaches the
 * end (closed, or dropped halfway) would otherwise keep it out of the persona
 * box for the rest of the event. Generous: nobody takes this long to finish.
 */
export const PERSONA_HOLD_MINUTES = 120;

/** Thermometers compared on the "which must always stay green?" screen. */
export const RANKED_THERMOMETERS: readonly ThermometerId[] = [
	'counterfactual',
	'parity',
	'opportunity'
];

/**
 * How often every pair of thermometers is asked (sides swapped the second time).
 * Once: 3 thermometers give 3 questions. Each pair's sides are already random,
 * so a left/right preference averages out across participants.
 */
export const RANKING_ROUNDS = 1;

/**
 * How often the results screens refresh while visible, and for how long. Short,
 * so a vote on a tablet shows up within a few seconds; the responses are tiny
 * and CDN-cached, so this stays light on slow wifi and on the database.
 */
export const RESULTS_POLL_INTERVAL_MS = 2_000;
export const RESULTS_POLL_MAX_DURATION_MS = 5 * 60_000;

/**
 * Beyond this many votes a row of the results shows "+n" instead of more
 * shapes. The shapes shrink to fit their row, so this only bounds the payload
 * and keeps an extreme count from turning the shapes into specks.
 */
export const RESULTS_MAX_SHAPES_PER_ROW = 120;

/**
 * Votes carry no identity, so the results show each vote as the persona of a
 * participant who reached that round's vote screen around the same time (see
 * `domain/voters.ts`). Arrivals further from a vote than this are not its voter.
 */
export const VOTER_ATTRIBUTION_WINDOW = { beforeMs: 10 * 60_000, afterMs: 60_000 } as const;

/** Network budget for API calls from the browser (venue wifi can be slow). */
export const API_TIMEOUT_MS = 6_000;

/**
 * Vote tablets: a press this soon after the previous one is ignored, so a
 * double tap (or a child drumming on the screen) counts as one vote.
 */
export const TABLET_DOUBLE_PRESS_MS = 600;

/** How long a tablet shows "thanks" after a vote. */
export const TABLET_THANKS_MS = 1_800;

/** Retry delays of a tablet that cannot reach the server: doubling up to the maximum. */
export const TABLET_RETRY_MIN_MS = 1_000;
export const TABLET_RETRY_MAX_MS = 15_000;

/**
 * Logged moments of a participant's run (`state/eventOutbox.ts`) wait this
 * long before they are sent, so they never compete with the demo's own
 * requests, and moments close together share one request.
 */
export const EVENT_SEND_DELAY_MS = 3_000;

/** Retry delays when the logged moments cannot be sent: doubling up to the maximum. */
export const EVENT_RETRY_MIN_MS = 5_000;
export const EVENT_RETRY_MAX_MS = 2 * 60_000;

/** Most logged moments sent in one request. */
export const EVENT_BATCH_SIZE = 20;

/** Most logged moments a phone keeps while it cannot reach the server; the oldest go first. */
export const EVENT_OUTBOX_MAX = 100;

/**
 * Whether the workshop version opens with a "which language?" screen and shows
 * the language switch. Off: the workshop runs in Dutch. The solo version, and
 * anyone who came through the start page, always get the switch.
 */
export const LANGUAGE_CHOICE_ENABLED = false;
