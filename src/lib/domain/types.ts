/**
 * Core vocabulary of the demo. Everything in `domain/` is framework-free and
 * deterministic so it can be unit-tested and shared between server and browser.
 */

export const SHAPES = ['circle', 'square', 'triangle'] as const;
export type Shape = (typeof SHAPES)[number];

export const SIZES = ['small', 'medium', 'large'] as const;
export type Size = (typeof SIZES)[number];

/** A row of the pre-existing persona list: what a participant is "born" with. */
export interface Persona {
	/** Stable id, used by the persona box, storage and analytics. */
	readonly id: string;
	readonly shape: Shape;
	readonly size: Size;
	/** Score the algorithm gives this CV before the participant picks a colour. */
	readonly baseScore: number;
	/** Hidden ground truth ("still employed after a year"), used by the equal-opportunity rule. */
	readonly qualified: boolean;
	/**
	 * This persona's size in the crowd of the blind-spot screen, when it differs
	 * from `size`: no persona is medium-sized, but some of their look-alikes are.
	 */
	readonly crowdSize?: Size;
}

export const COLOUR_IDS = ['yellow', 'green', 'blue', 'red'] as const;
export type ColourId = (typeof COLOUR_IDS)[number];

export function isColourId(value: unknown): value is ColourId {
	return (COLOUR_IDS as readonly unknown[]).includes(value);
}

/** A colour stands for everything the participant chooses (education, hobbies, friends). */
export interface Colour {
	readonly id: ColourId;
	readonly hex: string;
	/** Points added to the base score; hidden while choosing, revealed on the score screen. */
	readonly scoreModifier: number;
}

/** One applicant in the pool the algorithm ranks. */
export interface Candidate {
	readonly id: string;
	readonly shape: Shape;
	readonly size: Size;
	/** Display colour (hex). Only the participant's own colour affects the score. */
	readonly colour: string;
	readonly score: number;
	readonly qualified: boolean;
	readonly isYou: boolean;
}

/** The fairness "thermometers" (metrics) the demo explores, in order of appearance. */
export const THERMOMETER_IDS = ['counterfactual', 'parity', 'opportunity'] as const;
export type ThermometerId = (typeof THERMOMETER_IDS)[number];

/**
 * The rounds participants vote on, in order: the bare box, then one round per
 * thermometer. These ids are also stored in Supabase, so keep them stable.
 */
export const RULE_IDS = ['bare_box', 'counterfactual', 'parity', 'opportunity'] as const;
export type RuleId = (typeof RULE_IDS)[number];

/** Rounds that change who gets invited (the counterfactual round is a "what if" instead). */
export type SelectionRule = Exclude<RuleId, 'counterfactual'>;

/** Vote options of the physical buttons, from most negative to most positive. Stored in Supabase. */
export const VOTE_CHOICES = ['very_unfair', 'unfair', 'fair', 'very_fair'] as const;
export type VoteChoice = (typeof VOTE_CHOICES)[number];

export function isRuleId(value: unknown): value is RuleId {
	return (RULE_IDS as readonly unknown[]).includes(value);
}

export function isVoteChoice(value: unknown): value is VoteChoice {
	return (VOTE_CHOICES as readonly unknown[]).includes(value);
}

/** Ways to help, as told by the fence scene: the same crate, crates by need, or no fence at all. */
export const FENCE_STAGES = ['equality', 'equity', 'justice'] as const;
export type FenceStage = (typeof FENCE_STAGES)[number];

/**
 * "Twee manieren vooruit": sort fairly (equity) or repair first (justice).
 * At the workshop it is answered on paper: participants hang their card on that
 * side of the board. In the solo version they tap their choice in the app.
 */
export const PATH_CHOICES = ['sort', 'repair'] as const;
export type PathChoice = (typeof PATH_CHOICES)[number];

/** The poll id under which the solo version stores the way forward chosen. Stored in Supabase. */
export const TWO_WAYS_POLL = 'two_ways';

export type Locale = 'nl' | 'en';

/**
 * How a participant takes part in the demo:
 * - `workshop`: at the stand, with a physical block, a colour sticker, the vote
 *   tablets and a paper card; the app tells them what to do at the table.
 * - `solo`: on their own, anywhere. The app hands out the persona and asks for
 *   the votes itself, and never mentions the stand.
 */
export type Mode = 'workshop' | 'solo';

/** Moments of a participant's run that are logged for the analysis after an event. */
export const PARTICIPANT_EVENT_KINDS = ['opened', 'finished', 'pdf_download'] as const;
export type ParticipantEventKind = (typeof PARTICIPANT_EVENT_KINDS)[number];

export function isParticipantEventKind(value: unknown): value is ParticipantEventKind {
	return (PARTICIPANT_EVENT_KINDS as readonly unknown[]).includes(value);
}
