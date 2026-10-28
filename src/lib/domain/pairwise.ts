/**
 * Pairwise comparison ("A OF B?") turned into a ranking.
 */

import { shuffled } from '$lib/utils/random';

export interface Pair<T extends string> {
	readonly left: T;
	readonly right: T;
}

export interface PairChoice<T extends string> extends Pair<T> {
	readonly winner: T;
}

export interface RankedItem<T extends string> {
	readonly item: T;
	readonly wins: number;
	/** 1-based; items with equal wins share a position. */
	readonly position: number;
}

interface PairOptions {
	/** How often every pair is asked; later rounds swap left and right. */
	readonly rounds?: number;
	readonly random?: () => number;
}

/**
 * Every unordered pair, `rounds` times. Pairs are shuffled within a round, the
 * sides alternate between rounds (to cancel out position bias) and the same
 * pair is never asked twice in a row.
 */
export function buildPairs<T extends string>(
	items: readonly T[],
	{ rounds = 1, random = Math.random }: PairOptions = {}
): Pair<T>[] {
	const base: Pair<T>[] = [];
	items.forEach((a, i) => {
		items.slice(i + 1).forEach((b) => {
			base.push(random() < 0.5 ? { left: a, right: b } : { left: b, right: a });
		});
	});

	const result: Pair<T>[] = [];
	for (let round = 0; round < rounds; round++) {
		const pairs = shuffled(
			base.map((pair) => (round % 2 === 0 ? pair : { left: pair.right, right: pair.left })),
			random
		);
		const previous = result[result.length - 1];
		if (previous && pairs.length > 1 && pairKey(pairs[0]!) === pairKey(previous)) {
			pairs.push(pairs.shift()!);
		}
		result.push(...pairs);
	}
	return result;
}

/** Rank by number of wins (Copeland); ties keep the configured order. */
export function rankFromChoices<T extends string>(
	items: readonly T[],
	choices: readonly PairChoice<T>[]
): RankedItem<T>[] {
	const wins = new Map(items.map((item) => [item, 0]));
	for (const { winner } of choices) {
		if (wins.has(winner)) wins.set(winner, (wins.get(winner) ?? 0) + 1);
	}

	const sorted = [...items].sort((a, b) => (wins.get(b) ?? 0) - (wins.get(a) ?? 0));
	return sorted.map((item) => {
		const itemWins = wins.get(item) ?? 0;
		const position = 1 + sorted.filter((other) => (wins.get(other) ?? 0) > itemWins).length;
		return { item, wins: itemWins, position };
	});
}

export function pairKey<T extends string>(pair: Pair<T>): string {
	return [pair.left, pair.right].sort().join('|');
}
