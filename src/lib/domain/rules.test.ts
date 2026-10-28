import { describe, expect, it } from 'vitest';
import { PERSONAS } from '$lib/data/personas';
import { buildPool } from './candidates';
import { allocateProportionally, selectCandidates } from './rules';
import type { Candidate, Colour, SelectionRule } from './types';

const neutral: Colour = { id: 'green', hex: '#000', scoreModifier: 0 };
const pool = buildPool(PERSONAS, PERSONAS[0]!, neutral, ['#111'], () => 0);
const SLOTS = 6;

const invited = (rule: SelectionRule) => {
	const ids = selectCandidates(rule, pool, SLOTS);
	return pool.filter((c: Candidate) => ids.has(c.id));
};

describe('allocateProportionally', () => {
	it('distributes all slots by largest remainder', () => {
		expect(allocateProportionally([4, 6, 10], 6)).toEqual([1, 2, 3]);
		expect(allocateProportionally([2, 4, 7], 6)).toEqual([1, 2, 3]);
	});

	it('never allocates to empty groups and handles degenerate input', () => {
		expect(allocateProportionally([0, 5, 5], 3)).toEqual([0, 2, 1]);
		expect(allocateProportionally([0, 0], 3)).toEqual([0, 0]);
		expect(allocateProportionally([1, 1], 0)).toEqual([0, 0]);
	});
});

describe('selectCandidates', () => {
	it('always invites exactly the number of slots', () => {
		for (const rule of ['bare_box', 'parity', 'opportunity'] as const) {
			expect(invited(rule)).toHaveLength(SLOTS);
		}
	});

	it('bare box invites the six highest scores and no circles', () => {
		expect(
			invited('bare_box')
				.map((c) => c.id)
				.sort()
		).toEqual(['p01', 'p08', 'p09', 'p14', 'p19', 'p20']);
		expect(invited('bare_box').map((c) => c.shape)).not.toContain('circle');
	});

	it('parity gives every shape interviews in proportion to its size', () => {
		const shapes = invited('parity').map((c) => c.shape);
		expect(shapes.filter((s) => s === 'circle')).toHaveLength(1);
		expect(shapes.filter((s) => s === 'triangle')).toHaveLength(2);
		expect(shapes.filter((s) => s === 'square')).toHaveLength(3);
	});

	it('opportunity only invites qualified candidates', () => {
		expect(invited('opportunity').every((c) => c.qualified)).toBe(true);
	});
});
