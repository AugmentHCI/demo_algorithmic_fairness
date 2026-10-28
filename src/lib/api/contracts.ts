import { z } from 'zod';
import { EVENT_BATCH_SIZE } from '$lib/config';
import { findPersona, PERSONAS } from '$lib/data/personas';
import { personasOfBlock } from '$lib/domain/blocks';
import {
	COLOUR_IDS,
	PARTICIPANT_EVENT_KINDS,
	PATH_CHOICES,
	RULE_IDS,
	SHAPES,
	SIZES,
	THERMOMETER_IDS,
	TWO_WAYS_POLL,
	VOTE_CHOICES
} from '$lib/domain/types';
import type { ColourId, RuleId, Shape, Size, VoteChoice } from '$lib/domain/types';

/**
 * Request/response shapes shared by the API routes and the browser.
 * The browser only imports the *types* from this file, so zod stays server-side.
 */

/** Body the identity screen POSTs to /api/persona: who took a block, and which one. */
export const personaRequestSchema = z
	.object({
		/** The participant's own id, so asking again (a retry or a refresh) keeps their persona. */
		participantId: z.uuid(),
		shape: z.enum(SHAPES),
		size: z.enum(SIZES)
	})
	.refine((block) => personasOfBlock(PERSONAS, block).length > 0, {
		message: 'no persona has this shape and size'
	});
export type PersonaRequest = z.infer<typeof personaRequestSchema>;

export interface PersonaResponse {
	readonly personaId: string;
	/** `fallback` when the database could not be reached and a random persona of the block was used. */
	readonly source: 'box' | 'fallback';
}

/** Body POSTed to /api/persona/return when a participant finishes or starts over. */
export const personaReturnSchema = z.object({ participantId: z.uuid() });
export type PersonaReturn = z.infer<typeof personaReturnSchema>;

/** The persona a vote is shown as: the participant who most likely cast it, or a guess. */
export interface Voter {
	readonly shape: Shape;
	readonly size: Size;
	readonly colour: ColourId;
}

export interface VoteSummary {
	readonly rule: RuleId;
	/** Votes per answer; answers without votes count 0. */
	readonly counts: Readonly<Record<VoteChoice, number>>;
	/**
	 * Per answer, its first votes (at most `RESULTS_MAX_SHAPES_PER_ROW`) in the
	 * order they were cast, each as its likely voter (guessed when nobody can
	 * be paired with it).
	 */
	readonly voters: Readonly<Record<VoteChoice, readonly Voter[]>>;
	readonly total: number;
}

export const ruleIdSchema = z.enum(RULE_IDS);

/** Body the physical vote buttons and the vote tablets POST to /api/votes. */
export const voteIngestSchema = z.object({
	rule: ruleIdSchema,
	choice: z.enum(VOTE_CHOICES),
	station: z.string().trim().min(1).max(64).optional(),
	/** Chosen by the sender, so a retried vote is stored only once. */
	id: z.uuid().optional()
});
export type VoteIngest = z.infer<typeof voteIngestSchema>;

/** A participant, as their phone tells it: who they are and which persona they play. */
const participantSchema = z.object({
	/** The participant's own id, so telling it twice (going back and forth) counts once. */
	participantId: z.uuid(),
	personaId: z.string(),
	colourId: z.enum(COLOUR_IDS)
});

const hasKnownPersona = (body: { personaId: string }) => findPersona(body.personaId) !== undefined;
const UNKNOWN_PERSONA = { message: 'unknown persona', path: ['personaId'] };

/**
 * Body a phone POSTs to /api/arrivals when its participant reaches a round's
 * vote screen, so the results can show the votes as the people who cast them.
 */
export const arrivalSchema = participantSchema
	.extend({ rule: ruleIdSchema })
	.refine(hasKnownPersona, UNKNOWN_PERSONA);
export type Arrival = z.infer<typeof arrivalSchema>;

/**
 * Body a phone POSTs to /api/participant-votes in the solo version, where the
 * participant votes in the app: on a round, or on the two ways forward. Such a
 * vote knows its voter; voting again in the same poll changes it.
 */
export const participantVoteSchema = z
	.union([
		participantSchema.extend({ rule: ruleIdSchema, choice: z.enum(VOTE_CHOICES) }),
		participantSchema.extend({ rule: z.literal(TWO_WAYS_POLL), choice: z.enum(PATH_CHOICES) })
	])
	.refine(hasKnownPersona, UNKNOWN_PERSONA);
export type ParticipantVote = z.infer<typeof participantVoteSchema>;

const thermometerIdSchema = z.enum(THERMOMETER_IDS);

/** The pairwise answers of the ranking screen, also used to read them back from the database. */
export const rankingChoicesSchema = z
	.array(
		z.object({
			left: thermometerIdSchema,
			right: thermometerIdSchema,
			winner: thermometerIdSchema
		})
	)
	.max(16);

/** Body the ranking screen POSTs to /api/rankings. */
export const rankingSubmissionSchema = z
	.object({
		personaId: z.string().regex(/^p\d{2,3}$/),
		locale: z.enum(['nl', 'en']),
		ranking: z.array(thermometerIdSchema).min(1).max(THERMOMETER_IDS.length),
		choices: rankingChoicesSchema
	})
	.refine((body) => new Set(body.ranking).size === body.ranking.length, {
		message: 'ranking contains duplicates',
		path: ['ranking']
	});
export type RankingSubmission = z.infer<typeof rankingSubmissionSchema>;

/** Body a phone POSTs to /api/events: moments of its participants' runs, oldest first. */
export const participantEventsSchema = z.object({
	events: z
		.array(
			z.object({
				participantId: z.uuid(),
				kind: z.enum(PARTICIPANT_EVENT_KINDS),
				/** When it happened, in ms since the epoch by the phone's clock. */
				at: z.number().int().positive().max(8.64e15)
			})
		)
		.min(1)
		.max(EVENT_BATCH_SIZE)
});
export type ParticipantEvents = z.infer<typeof participantEventsSchema>;
export type ParticipantEvent = ParticipantEvents['events'][number];

/** What GET /api/rankings answers: everyone's rankings put together. */
export type { RankingSummary } from '$lib/domain/rankingSummary';
