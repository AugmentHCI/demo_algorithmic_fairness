import { describe, expect, it } from 'vitest';
import { RULE_IDS, VOTE_CHOICES } from '$lib/domain/types';
import { EVENT_BATCH_SIZE } from '$lib/config';
import {
	arrivalSchema,
	participantEventsSchema,
	participantVoteSchema,
	personaRequestSchema,
	voteIngestSchema
} from './contracts';

const ID = '6f1c1f2e-1a2b-4c3d-8e9f-0a1b2c3d4e5f';

describe('voteIngestSchema', () => {
	it('accepts every answer of every round', () => {
		for (const rule of RULE_IDS) {
			for (const choice of VOTE_CHOICES) {
				expect(voteIngestSchema.safeParse({ rule, choice, id: ID }).success).toBe(true);
			}
		}
	});

	it('rejects polls and answers that no longer exist', () => {
		expect(voteIngestSchema.safeParse({ rule: 'two_ways', choice: 'fair' }).success).toBe(false);
		expect(voteIngestSchema.safeParse({ rule: 'parity', choice: 'repair' }).success).toBe(false);
		expect(voteIngestSchema.safeParse({ rule: 'opinion', choice: 'yes' }).success).toBe(false);
	});

	it('rejects an id that is not a UUID', () => {
		expect(voteIngestSchema.safeParse({ rule: 'parity', choice: 'fair', id: 'x' }).success).toBe(
			false
		);
	});
});

describe('arrivalSchema', () => {
	const arrival = { participantId: ID, rule: 'parity', personaId: 'p07', colourId: 'green' };

	it('accepts a known persona in a colour arriving at a round', () => {
		expect(arrivalSchema.safeParse(arrival).success).toBe(true);
	});

	it('rejects an unknown persona, colour or round, and a missing participant', () => {
		expect(arrivalSchema.safeParse({ ...arrival, personaId: 'p999' }).success).toBe(false);
		expect(arrivalSchema.safeParse({ ...arrival, colourId: 'purple' }).success).toBe(false);
		expect(arrivalSchema.safeParse({ ...arrival, rule: 'two_ways' }).success).toBe(false);
		expect(arrivalSchema.safeParse({ ...arrival, participantId: undefined }).success).toBe(false);
	});
});

describe('participantVoteSchema', () => {
	const vote = {
		participantId: ID,
		rule: 'parity',
		choice: 'fair',
		personaId: 'p07',
		colourId: 'green'
	};

	it('accepts every answer of a known persona in a colour', () => {
		for (const choice of VOTE_CHOICES) {
			expect(participantVoteSchema.safeParse({ ...vote, choice }).success).toBe(true);
		}
	});

	it('accepts the two ways forward, with their own answers', () => {
		const twoWays = { ...vote, rule: 'two_ways' };
		expect(participantVoteSchema.safeParse({ ...twoWays, choice: 'repair' }).success).toBe(true);
		expect(participantVoteSchema.safeParse({ ...twoWays, choice: 'fair' }).success).toBe(false);
		expect(participantVoteSchema.safeParse({ ...vote, choice: 'repair' }).success).toBe(false);
	});

	it('rejects an unknown answer or persona, and a vote without its voter', () => {
		expect(participantVoteSchema.safeParse({ ...vote, choice: 'yes' }).success).toBe(false);
		expect(participantVoteSchema.safeParse({ ...vote, personaId: 'p999' }).success).toBe(false);
		expect(participantVoteSchema.safeParse({ ...vote, participantId: undefined }).success).toBe(
			false
		);
		expect(participantVoteSchema.safeParse({ ...vote, colourId: undefined }).success).toBe(false);
	});
});

describe('personaRequestSchema', () => {
	const request = (block: object) =>
		personaRequestSchema.safeParse({ participantId: ID, ...block });

	it('accepts a block someone has', () => {
		expect(request({ shape: 'triangle', size: 'small' }).success).toBe(true);
	});

	it('rejects a block nobody has, and anything that is not a block', () => {
		expect(request({ shape: 'circle', size: 'medium' }).success).toBe(false);
		expect(request({ shape: 'star', size: 'large' }).success).toBe(false);
		expect(request({}).success).toBe(false);
	});

	it('rejects a request without a participant', () => {
		expect(personaRequestSchema.safeParse({ shape: 'triangle', size: 'small' }).success).toBe(
			false
		);
	});
});

describe('participantEventsSchema', () => {
	const event = { participantId: ID, kind: 'finished', at: Date.parse('2026-10-19T10:00:00Z') };
	const parse = (events: unknown[]) => participantEventsSchema.safeParse({ events }).success;

	it('accepts a batch of known moments', () => {
		expect(parse([event, { ...event, kind: 'opened' }, { ...event, kind: 'pdf_download' }])).toBe(
			true
		);
	});

	it('rejects an empty or oversized batch', () => {
		expect(parse([])).toBe(false);
		expect(parse(Array.from({ length: EVENT_BATCH_SIZE + 1 }, () => event))).toBe(false);
	});

	it('rejects an unknown moment, a bad time and a missing participant', () => {
		expect(parse([{ ...event, kind: 'clicked' }])).toBe(false);
		expect(parse([{ ...event, at: 'yesterday' }])).toBe(false);
		expect(parse([{ ...event, at: 1.5 }])).toBe(false);
		expect(parse([{ ...event, participantId: undefined }])).toBe(false);
	});
});
