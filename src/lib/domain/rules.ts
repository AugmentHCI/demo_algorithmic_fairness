import { byScoreDesc } from './candidates';
import type { Candidate, SelectionRule } from './types';
import { SHAPES } from './types';

/** Ids of the candidates invited for an interview. */
export type Selection = ReadonlySet<string>;

/**
 * Who gets an interview under a rule.
 *
 * - `bare_box`: the algorithm as bought, the highest scores win.
 * - `parity` ("gelijk deel"): every shape gets interview slots in proportion
 *   to its size, filled with the best scores of that shape.
 * - `opportunity` ("even vaak gevonden"): only genuinely qualified candidates are
 *   considered, and every shape gets slots in proportion to its number of
 *   qualified candidates.
 */
export function selectCandidates(
	rule: SelectionRule,
	pool: readonly Candidate[],
	slots: number
): Selection {
	switch (rule) {
		case 'bare_box':
			return topByScore(pool, slots);
		case 'parity':
			return selectWithQuotas(pool, slots);
		case 'opportunity':
			return selectWithQuotas(
				pool.filter((c) => c.qualified),
				slots
			);
	}
}

function topByScore(candidates: readonly Candidate[], count: number): Set<string> {
	return new Set(
		[...candidates]
			.sort(byScoreDesc((c) => c.score))
			.slice(0, Math.max(0, count))
			.map((c) => c.id)
	);
}

/**
 * Split `slots` over the shapes in proportion to how many candidates each shape
 * has, and fill each shape's quota with its highest scores.
 */
function selectWithQuotas(candidates: readonly Candidate[], slots: number): Set<string> {
	const groups = SHAPES.map((shape) => candidates.filter((c) => c.shape === shape));
	const quotas = allocateProportionally(
		groups.map((group) => group.length),
		Math.min(slots, candidates.length)
	);

	const selected = new Set<string>();
	groups.forEach((group, index) => {
		for (const id of topByScore(group, quotas[index] ?? 0)) selected.add(id);
	});
	return selected;
}

/**
 * Largest-remainder (Hamilton) apportionment: integer shares that sum to `total`
 * and are as close as possible to the exact proportional shares.
 */
export function allocateProportionally(weights: readonly number[], total: number): number[] {
	const weightSum = weights.reduce((sum, w) => sum + Math.max(0, w), 0);
	if (weightSum === 0 || total <= 0) return weights.map(() => 0);

	const exact = weights.map((w) => (Math.max(0, w) / weightSum) * total);
	const shares = exact.map(Math.floor);
	let leftover = total - shares.reduce((sum, s) => sum + s, 0);

	const byRemainder = exact
		.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
		.sort((a, b) => b.remainder - a.remainder || a.index - b.index);

	for (const { index } of byRemainder) {
		if (leftover === 0) break;
		shares[index] = (shares[index] ?? 0) + 1;
		leftover -= 1;
	}
	return shares;
}
