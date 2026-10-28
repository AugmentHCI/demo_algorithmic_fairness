import { describe, expect, it } from 'vitest';
import { attributeEveryVote, attributeVotes, guessVoter } from './voters';

const WINDOW = { beforeMs: 60_000, afterMs: 5_000 };
const arrival = (id: string, at: number) => ({ id, at });
const vote = (at: number) => ({ at });

const ids = (result: ({ id: string } | null)[]) => result.map((a) => a?.id ?? null);

describe('attributeVotes', () => {
	it('gives each vote the arrival closest to it', () => {
		const arrivals = [arrival('a', 0), arrival('b', 20_000)];
		expect(ids(attributeVotes([vote(25_000), vote(4_000)], arrivals, WINDOW))).toEqual(['b', 'a']);
	});

	it('uses every arrival at most once', () => {
		const arrivals = [arrival('a', 0)];
		expect(ids(attributeVotes([vote(1_000), vote(2_000)], arrivals, WINDOW))).toEqual(['a', null]);
	});

	it('handles votes in the order they were cast, whatever their order in the list', () => {
		const arrivals = [arrival('a', 0), arrival('b', 1_000)];
		// The vote at 10 s came first and takes the closest arrival, "b"; the one at 20 s gets "a".
		expect(ids(attributeVotes([vote(20_000), vote(10_000)], arrivals, WINDOW))).toEqual(['a', 'b']);
	});

	it('prefers the earlier arrival on a tie', () => {
		const arrivals = [arrival('late', 12_000), arrival('early', 8_000)];
		expect(ids(attributeVotes([vote(10_000)], arrivals, WINDOW))).toEqual(['early']);
	});

	it('ignores arrivals outside the window', () => {
		const arrivals = [arrival('stale', 0), arrival('future', 100_000)];
		expect(ids(attributeVotes([vote(90_000)], arrivals, WINDOW))).toEqual([null]);
	});

	it('accepts an arrival that came in shortly after the vote', () => {
		expect(ids(attributeVotes([vote(10_000)], [arrival('a', 13_000)], WINDOW))).toEqual(['a']);
	});

	it('returns nothing but nulls without arrivals', () => {
		expect(attributeVotes([vote(0), vote(1)], [], WINDOW)).toEqual([null, null]);
	});
});

describe('attributeEveryVote', () => {
	it('pairs votes within the window first, as attributeVotes does', () => {
		const arrivals = [arrival('a', 0), arrival('b', 20_000)];
		expect(ids(attributeEveryVote([vote(25_000), vote(4_000)], arrivals, WINDOW))).toEqual([
			'b',
			'a'
		]);
	});

	it('gives a vote outside every window the closest arrival nobody claimed', () => {
		const arrivals = [arrival('near', 0), arrival('stale', -900_000), arrival('older', -1_800_000)];
		const votes = [vote(1_000), vote(1_000_000)];
		expect(ids(attributeEveryVote(votes, arrivals, WINDOW))).toEqual(['near', 'stale']);
	});

	it('never uses an arrival twice', () => {
		const arrivals = [arrival('a', 0)];
		expect(ids(attributeEveryVote([vote(1_000), vote(500_000)], arrivals, WINDOW))).toEqual([
			'a',
			null
		]);
	});

	it('leaves votes unpaired only when the arrivals run out', () => {
		expect(attributeEveryVote([vote(0)], [], WINDOW)).toEqual([null]);
	});
});

describe('guessVoter', () => {
	const options = ['a', 'b', 'c', 'd'];

	it('always gives the same vote the same guess', () => {
		expect(guessVoter(7, options)).toBe(guessVoter(7, options));
	});

	it('uses every option over a run of votes', () => {
		const guesses = new Set(Array.from({ length: 40 }, (_, i) => guessVoter(i, options)));
		expect(guesses).toEqual(new Set(options));
	});

	it('refuses an empty list', () => {
		expect(() => guessVoter(0, [])).toThrow(RangeError);
	});
});
