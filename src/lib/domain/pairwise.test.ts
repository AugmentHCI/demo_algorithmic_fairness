import { describe, expect, it } from 'vitest';
import { buildPairs, pairKey, rankFromChoices } from './pairwise';

const items = ['a', 'b', 'c'] as const;

function seeded(seed = 42) {
	return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

describe('buildPairs', () => {
	it('creates every unordered pair exactly once per round', () => {
		const pairs = buildPairs(items);
		expect(pairs).toHaveLength(3);
		expect(new Set(pairs.map(pairKey)).size).toBe(3);
	});

	it('asks every pair twice with swapped sides when there are two rounds', () => {
		const pairs = buildPairs(items, { rounds: 2, random: seeded() });
		expect(pairs).toHaveLength(6);
		for (const key of new Set(pairs.map(pairKey))) {
			const asked = pairs.filter((p) => pairKey(p) === key);
			expect(asked).toHaveLength(2);
			expect(asked[0]!.left).toBe(asked[1]!.right);
		}
	});

	it('never asks the same pair twice in a row', () => {
		for (let seed = 1; seed < 50; seed++) {
			const pairs = buildPairs(items, { rounds: 2, random: seeded(seed) });
			pairs.slice(1).forEach((pair, i) => expect(pairKey(pair)).not.toBe(pairKey(pairs[i]!)));
		}
	});

	it('is deterministic for a given random source', () => {
		expect(buildPairs(items, { rounds: 2, random: seeded() })).toEqual(
			buildPairs(items, { rounds: 2, random: seeded() })
		);
	});
});

describe('rankFromChoices', () => {
	it('ranks by number of wins', () => {
		const ranking = rankFromChoices(
			['a', 'b', 'c'],
			[
				{ left: 'a', right: 'b', winner: 'b' },
				{ left: 'a', right: 'c', winner: 'a' },
				{ left: 'b', right: 'c', winner: 'b' }
			]
		);
		expect(ranking.map((r) => r.item)).toEqual(['b', 'a', 'c']);
		expect(ranking.map((r) => r.position)).toEqual([1, 2, 3]);
	});

	it('lets items with equal wins share a position', () => {
		const ranking = rankFromChoices(
			['a', 'b', 'c'],
			[
				{ left: 'a', right: 'b', winner: 'a' },
				{ left: 'b', right: 'c', winner: 'b' },
				{ left: 'c', right: 'a', winner: 'c' }
			]
		);
		expect(ranking.every((r) => r.position === 1)).toBe(true);
	});
});
