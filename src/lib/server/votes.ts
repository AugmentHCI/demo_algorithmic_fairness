import type { Arrival, ParticipantVote, Voter, VoteIngest, VoteSummary } from '$lib/api/contracts';
import { RESULTS_MAX_SHAPES_PER_ROW, VOTER_ATTRIBUTION_WINDOW } from '$lib/config';
import { findPersona, PERSONAS } from '$lib/data/personas';
import {
	COLOUR_IDS,
	isColourId,
	isVoteChoice,
	VOTE_CHOICES,
	type RuleId,
	type VoteChoice
} from '$lib/domain/types';
import { attributeEveryVote, guessVoter } from '$lib/domain/voters';
import { getEventId } from './env';
import { DatabaseUnavailableError } from './errors';
import { getDb } from './supabase';

/** The `station` of votes cast in the app (the solo version), to tell them apart in the data. */
const APP_STATION = 'app';

/**
 * How many votes and arrivals are read to pair them up. Pairing goes in the
 * order votes were cast, so the first votes' voters never depend on later
 * rows; this is far more than the shapes a results screen shows.
 */
const MAX_ROWS = 1000;

/** Every look a voter can have, for votes that cannot be paired with anyone. */
const POSSIBLE_VOTERS: readonly Voter[] = PERSONAS.flatMap(({ shape, size }) =>
	COLOUR_IDS.map((colour) => ({ shape, size, colour }))
);

const perChoice = <T>(value: () => T): Record<VoteChoice, T> =>
	Object.fromEntries(VOTE_CHOICES.map((choice) => [choice, value()])) as Record<VoteChoice, T>;

export async function getVoteSummary(rule: RuleId): Promise<VoteSummary> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();
	const eventId = getEventId();

	const [summary, votes, arrivals] = await Promise.all([
		db.rpc('vote_summary', { p_event_id: eventId, p_rule: rule }),
		db
			.from('votes')
			.select('choice, created_at, persona_id, colour_id')
			.eq('event_id', eventId)
			.eq('rule', rule)
			.order('created_at')
			.order('id')
			.limit(MAX_ROWS),
		db
			.from('vote_arrivals')
			.select('persona_id, colour_id, created_at')
			.eq('event_id', eventId)
			.eq('rule', rule)
			.order('created_at')
			.limit(MAX_ROWS)
	]);
	if (summary.error) throw summary.error;
	if (votes.error) throw votes.error;
	if (arrivals.error) throw arrivals.error;

	const counts = perChoice(() => 0);
	for (const row of summary.data ?? []) {
		if (isVoteChoice(row.choice)) counts[row.choice] = Number(row.votes) || 0;
	}

	const cast = votes.data.map((row) => ({
		choice: row.choice,
		at: Date.parse(row.created_at),
		// Votes cast in the app know their voter; those from tablets and buttons don't.
		voter: row.persona_id && row.colour_id ? voterOf(row.persona_id, row.colour_id) : null
	}));
	const arrived = arrivals.data.map((row) => ({
		voter: voterOf(row.persona_id, row.colour_id),
		at: Date.parse(row.created_at)
	}));

	// Only the votes without a known voter are paired with arrivals.
	const anonymous = cast.flatMap((vote, i) => (vote.voter ? [] : [i]));
	const paired = attributeEveryVote(
		anonymous.map((i) => cast[i]!),
		arrived,
		VOTER_ATTRIBUTION_WINDOW
	);
	const voterOfVote = cast.map((vote) => vote.voter);
	anonymous.forEach((voteIndex, i) => (voterOfVote[voteIndex] = paired[i]?.voter ?? null));

	// A vote nobody can be paired with is still shown as someone: a guess.
	const voters = perChoice((): Voter[] => []);
	cast.forEach(({ choice }, i) => {
		if (!isVoteChoice(choice) || voters[choice].length >= RESULTS_MAX_SHAPES_PER_ROW) return;
		voters[choice].push(voterOfVote[i] ?? guessVoter(i, POSSIBLE_VOTERS));
	});

	const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
	return { rule, counts, voters, total };
}

function voterOf(personaId: string, colourId: string): Voter | null {
	const persona = findPersona(personaId);
	if (!persona || !isColourId(colourId)) return null;
	return { shape: persona.shape, size: persona.size, colour: colourId };
}

export async function recordVote(vote: VoteIngest): Promise<void> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();

	const row = {
		event_id: getEventId(),
		rule: vote.rule,
		choice: vote.choice,
		station: vote.station ?? null,
		client_id: vote.id ?? null
	};
	// A vote with an id may arrive twice (a retry after a lost response): store it once.
	const { error } = vote.id
		? await db.from('votes').upsert(row, { onConflict: 'client_id', ignoreDuplicates: true })
		: await db.from('votes').insert(row);
	if (error) throw error;
}

/** Store a vote cast in the app; a participant voting again in the same round changes their vote. */
export async function recordParticipantVote(vote: ParticipantVote): Promise<void> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();

	const { error } = await db.from('votes').upsert(
		{
			event_id: getEventId(),
			rule: vote.rule,
			choice: vote.choice,
			station: APP_STATION,
			participant_id: vote.participantId,
			persona_id: vote.personaId,
			colour_id: vote.colourId
		},
		{ onConflict: 'event_id,rule,participant_id' }
	);
	if (error) throw error;
}

/** Note that a participant reached a round's vote screen; only their first arrival counts. */
export async function recordArrival(arrival: Arrival): Promise<void> {
	const db = getDb();
	if (!db) throw new DatabaseUnavailableError();

	const { error } = await db.from('vote_arrivals').upsert(
		{
			event_id: getEventId(),
			rule: arrival.rule,
			participant_id: arrival.participantId,
			persona_id: arrival.personaId,
			colour_id: arrival.colourId
		},
		{ onConflict: 'event_id,rule,participant_id', ignoreDuplicates: true }
	);
	if (error) throw error;
}
