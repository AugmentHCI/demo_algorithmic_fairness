import type { Candidate, Colour, Persona, Shape, Size } from './types';
import { SHAPES, SIZES } from './types';

export const MIN_SCORE = 0;
export const MAX_SCORE = 100;

export function clampScore(score: number): number {
	return Math.min(MAX_SCORE, Math.max(MIN_SCORE, score));
}

/** The score the algorithm gives a participant: persona base score plus chosen colour. */
export function participantScore(persona: Persona, colour: Colour): number {
	return clampScore(persona.baseScore + colour.scoreModifier);
}

/**
 * The applicant pool the box ranks: every persona from the list, where the
 * participant's own persona carries the colour they picked. The other
 * applicants get a display colour drawn from `palette` (it does not affect
 * their score). Every persona draws one, yours too, so the others' colours do
 * not depend on who you are.
 */
export function buildPool(
	personas: readonly Persona[],
	you: Persona,
	colour: Colour,
	palette: readonly string[],
	random: () => number
): Candidate[] {
	if (palette.length === 0) throw new Error('The display palette is empty');
	return personas.map((persona) => {
		const isYou = persona.id === you.id;
		const drawn = palette[Math.floor(random() * palette.length)] as string;
		return {
			id: persona.id,
			shape: persona.shape,
			size: persona.size,
			colour: isYou ? colour.hex : drawn,
			qualified: persona.qualified,
			score: isYou ? participantScore(persona, colour) : persona.baseScore,
			isYou
		};
	});
}

/**
 * Sort by score (desc). Ties are broken by id so the order is stable and
 * identical on every device.
 */
export function byScoreDesc<T extends { id: string }>(scoreOf: (item: T) => number) {
	return (a: T, b: T): number => scoreOf(b) - scoreOf(a) || a.id.localeCompare(b.id);
}

/** The pool from highest to lowest score. */
export function rankPool(pool: readonly Candidate[]): Candidate[] {
	return [...pool].sort(byScoreDesc((c) => c.score));
}

/** 1-based rank of a candidate in the pool. */
export function rankOf(pool: readonly Candidate[], candidateId: string): number {
	const index = rankPool(pool).findIndex((c) => c.id === candidateId);
	if (index === -1) throw new Error(`Candidate ${candidateId} is not in the pool`);
	return index + 1;
}

/**
 * The scores the box gave each group in the persona list, sorted low to high.
 * The box was trained on biased hiring data: the gaps between these groups are
 * the hidden effect of shape and size that thermometer 1 ("je vorm alleen") exposes.
 */
export interface ScoreDistributions {
	readonly shape: Readonly<Record<Shape, readonly number[]>>;
	readonly size: Readonly<Record<Size, readonly number[]>>;
}

export function scoreDistributions(personas: readonly Persona[]): ScoreDistributions {
	const sortedScores = <K extends string>(keys: readonly K[], keyOf: (p: Persona) => K) =>
		Object.fromEntries(
			keys.map((key) => [
				key,
				personas
					.filter((p) => keyOf(p) === key)
					.map((p) => p.baseScore)
					.sort((a, b) => a - b)
			])
		) as Record<K, number[]>;

	return {
		shape: sortedScores(SHAPES, (p) => p.shape),
		size: sortedScores(SIZES, (p) => p.size)
	};
}

/**
 * The base score the box would give the same CV if only its shape and/or size
 * were different. The CV keeps its standing: it lands at the same relative place
 * among the new group as it had in its own group, so the result always lies
 * within the scores that group actually got (the best circle becomes the best
 * square, not a square better than any in the data).
 */
export function counterfactualBaseScore(
	persona: Persona,
	change: { shape?: Shape; size?: Size },
	distributions: ScoreDistributions
): number {
	let score = persona.baseScore;
	if (change.shape && change.shape !== persona.shape) {
		score = transfer(score, distributions.shape[persona.shape], distributions.shape[change.shape]);
	}
	if (change.size && change.size !== persona.size) {
		score = transfer(score, distributions.size[persona.size], distributions.size[change.size]);
	}
	return score;
}

/** Map a score from one sorted distribution to the same percentile of another. */
function transfer(score: number, from: readonly number[], to: readonly number[]): number {
	if (from.length === 0 || to.length === 0) return score;
	return quantile(to, percentileOf(from, score));
}

/** Where `value` sits in `sorted`, from 0 (lowest) to 1 (highest); ties share their middle. */
function percentileOf(sorted: readonly number[], value: number): number {
	if (sorted.length === 1) return 0.5;
	const below = sorted.filter((s) => s < value).length;
	const equal = sorted.filter((s) => s === value).length;
	const position = Math.min(sorted.length - 1, Math.max(0, below + (equal - 1) / 2));
	return position / (sorted.length - 1);
}

/** The value at percentile `p` (0–1) of `sorted`, interpolating between neighbours. */
function quantile(sorted: readonly number[], p: number): number {
	const position = p * (sorted.length - 1);
	const lower = sorted[Math.floor(position)] as number;
	const upper = sorted[Math.ceil(position)] as number;
	return lower + (upper - lower) * (position - Math.floor(position));
}
