/**
 * Intersectionality: a rule can be fair between shapes and still overlook a
 * subgroup, such as the small squares, where shape and size cross.
 */
import type { Candidate, Shape, Size } from './types';
import { SHAPES, SIZES } from './types';

/** How many applicants a group had, and how many of them were invited. */
export interface Tally {
	readonly invited: number;
	readonly total: number;
}

export interface IntersectionTable {
	/** One tally per shape × size. */
	readonly cells: Readonly<Record<Shape, Readonly<Record<Size, Tally>>>>;
	/** One tally per shape, all sizes together. */
	readonly shapes: Readonly<Record<Shape, Tally>>;
}

export interface Subgroup {
	readonly shape: Shape;
	readonly size: Size;
	readonly tally: Tally;
}

export function tallyIntersections(
	pool: readonly Candidate[],
	invitedIds: ReadonlySet<string>
): IntersectionTable {
	const tally = (members: readonly Candidate[]): Tally => ({
		invited: members.filter((c) => invitedIds.has(c.id)).length,
		total: members.length
	});
	const ofShape = (shape: Shape) => pool.filter((c) => c.shape === shape);

	return {
		cells: recordOf(SHAPES, (shape) =>
			recordOf(SIZES, (size) => tally(ofShape(shape).filter((c) => c.size === size)))
		),
		shapes: recordOf(SHAPES, (shape) => tally(ofShape(shape)))
	};
}

/** Share of a group that was invited, or `null` for an empty group. */
export function inviteRate({ invited, total }: Tally): number | null {
	return total === 0 ? null : invited / total;
}

/** Within one shape, the subgroup a rule served best and the one it served worst. */
export interface SubgroupSplit {
	readonly shape: Shape;
	readonly favoured: Subgroup;
	readonly overlooked: Subgroup;
}

/**
 * The shape whose subgroups a rule treated most differently: the widest gap
 * between the share invited of its best- and its worst-served subgroup. Within
 * a shape, and between shapes, ties go to the larger groups, because "0 of 3"
 * says more than "0 of 1". Empty subgroups are skipped; `undefined` when no
 * shape has subgroups with different shares.
 */
export function sharpestSplit(table: IntersectionTable): SubgroupSplit | undefined {
	const splits = SHAPES.flatMap((shape): SubgroupSplit[] => {
		const subgroups = SIZES.map((size): Subgroup => ({
			shape,
			size,
			tally: table.cells[shape][size]
		})).filter((group) => group.tally.total > 0);
		const favoured = pickBest(subgroups, (a, b) => isBetterOff(a.tally, b.tally));
		const overlooked = pickBest(subgroups, (a, b) => isWorseOff(a.tally, b.tally));
		if (!favoured || !overlooked || compareShares(favoured.tally, overlooked.tally) === 0)
			return [];
		return [{ shape, favoured, overlooked }];
	});
	return pickBest(splits, isWider);
}

/** The sign of `share(a) − share(b)`, cross-multiplied so equal fractions (1/3, 2/6) are exactly equal. */
function compareShares(a: Tally, b: Tally): number {
	return Math.sign(a.invited * b.total - b.invited * a.total);
}

function isWorseOff(a: Tally, b: Tally): boolean {
	const difference = compareShares(a, b);
	return difference < 0 || (difference === 0 && a.total > b.total);
}

function isBetterOff(a: Tally, b: Tally): boolean {
	const difference = compareShares(a, b);
	return difference > 0 || (difference === 0 && a.total > b.total);
}

/** Compares the gaps `f₁/F₁ − o₁/O₁` and `f₂/F₂ − o₂/O₂` exactly, as fractions over `F·O`. */
function isWider(a: SubgroupSplit, b: SubgroupSplit): boolean {
	const gap = ({ favoured: { tally: f }, overlooked: { tally: o } }: SubgroupSplit) => ({
		over: f.invited * o.total - o.invited * f.total,
		under: f.total * o.total
	});
	const [x, y] = [gap(a), gap(b)];
	const difference = x.over * y.under - y.over * x.under;
	const size = (split: SubgroupSplit) => split.favoured.tally.total + split.overlooked.tally.total;
	return difference > 0 || (difference === 0 && size(a) > size(b));
}

/** The item no other item beats; the first one on a tie. */
function pickBest<T>(items: readonly T[], beats: (a: T, b: T) => boolean): T | undefined {
	const [first, ...rest] = items;
	if (first === undefined) return undefined;
	return rest.reduce((best, item) => (beats(item, best) ? item : best), first);
}

function recordOf<K extends string, V>(keys: readonly K[], valueOf: (key: K) => V): Record<K, V> {
	return Object.fromEntries(keys.map((key) => [key, valueOf(key)])) as Record<K, V>;
}
