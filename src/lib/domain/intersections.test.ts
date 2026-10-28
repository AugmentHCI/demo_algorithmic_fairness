import { describe, expect, it } from 'vitest';
import { CROWD_FACTOR } from '$lib/config';
import { COLOURS, findColour } from '$lib/data/colours';
import { crowdSizeOf, findPersona, PERSONAS } from '$lib/data/personas';
import { multiplyPool } from './crowd';
import { inviteRate, sharpestSplit, tallyIntersections } from './intersections';
import { buildScenario } from './scenario';
import type { Candidate, Colour, Persona } from './types';
import { SHAPES, SIZES } from './types';

const scenarioFor = (persona: Persona, colour: Colour = findColour('yellow')!) =>
	buildScenario({
		personas: PERSONAS,
		persona,
		colour,
		palette: ['#0072b2'],
		random: () => 0,
		slots: 6
	});

const candidate = (id: string, shape: Candidate['shape'], size: Candidate['size']): Candidate => ({
	id,
	shape,
	size,
	colour: '#000',
	score: 50,
	qualified: true,
	isYou: false
});

describe('tallyIntersections', () => {
	const { pool, outcomes } = scenarioFor(findPersona('p02')!);
	const table = tallyIntersections(pool, outcomes.parity.invitedIds);

	it('adds the cells of a shape up to that shape’s total', () => {
		for (const shape of SHAPES) {
			const sum = SIZES.reduce(
				(acc, size) => ({
					invited: acc.invited + table.cells[shape][size].invited,
					total: acc.total + table.cells[shape][size].total
				}),
				{ invited: 0, total: 0 }
			);
			expect(sum).toEqual(table.shapes[shape]);
		}
	});

	it('counts every applicant and every invitation once', () => {
		const totals = SHAPES.map((shape) => table.shapes[shape]);
		expect(totals.reduce((n, t) => n + t.total, 0)).toBe(pool.length);
		expect(totals.reduce((n, t) => n + t.invited, 0)).toBe(outcomes.parity.invitedIds.size);
	});

	it('shows that equal share looks fair per shape but not per subgroup', () => {
		// Squares as a group get their proportional 3 of 10, but not a single small square is invited.
		expect(table.shapes.square).toEqual({ invited: 3, total: 10 });
		expect(table.cells.square.small).toEqual({ invited: 0, total: 5 });
	});
});

describe('inviteRate', () => {
	it('is null for an empty group', () => {
		expect(inviteRate({ invited: 0, total: 0 })).toBeNull();
		expect(inviteRate({ invited: 1, total: 4 })).toBe(0.25);
	});
});

describe('sharpestSplit', () => {
	const split = (pool: Candidate[], invited: string[]) =>
		sharpestSplit(tallyIntersections(pool, new Set(invited)));

	it('picks the shape with the widest gap between its best- and worst-served subgroup', () => {
		const pool = [
			// Circles: 1/2 against 0/2, a gap of 1/2.
			...['a', 'b'].map((id) => candidate(id, 'circle', 'small')),
			...['c', 'd'].map((id) => candidate(id, 'circle', 'large')),
			// Squares: 2/2 against 0/1, a gap of 1.
			...['e', 'f'].map((id) => candidate(id, 'square', 'large')),
			candidate('g', 'square', 'medium'),
			candidate('h', 'square', 'small')
		];
		expect(split(pool, ['a', 'e', 'f', 'h'])).toEqual({
			shape: 'square',
			favoured: { shape: 'square', size: 'large', tally: { invited: 2, total: 2 } },
			overlooked: { shape: 'square', size: 'medium', tally: { invited: 0, total: 1 } }
		});
	});

	it('prefers larger groups when shares are equal', () => {
		const pool = [
			candidate('a', 'circle', 'small'),
			candidate('b', 'circle', 'large'),
			...['c', 'd', 'e'].map((id) => candidate(id, 'triangle', 'small')),
			...['f', 'g'].map((id) => candidate(id, 'triangle', 'medium')),
			candidate('h', 'triangle', 'large')
		];
		// Both shapes split 1/1 against 0/n; the triangles have more applicants in it.
		expect(split(pool, ['a', 'f', 'g', 'h'])).toMatchObject({
			shape: 'triangle',
			favoured: { size: 'medium' },
			overlooked: { size: 'small' }
		});
	});

	it('treats equal fractions as equal shares', () => {
		const pool = [
			candidate('a', 'square', 'small'),
			candidate('b', 'square', 'small'),
			...['c', 'd', 'e', 'f'].map((id) => candidate(id, 'square', 'large'))
		];
		expect(split(pool, ['a', 'c', 'd'])).toBeUndefined();
	});

	it('returns undefined for an empty pool', () => {
		expect(split([], [])).toBeUndefined();
	});

	it('always finds a subgroup without interviews beside a served one under equal share', () => {
		// The "corner nobody checked" screen relies on this with the workshop data.
		for (const persona of PERSONAS) {
			for (const colour of COLOURS) {
				const { pool, outcomes } = scenarioFor(persona, colour);
				const found = sharpestSplit(tallyIntersections(pool, outcomes.parity.invitedIds));
				expect(found?.overlooked.tally.invited).toBe(0);
				expect(found?.favoured.tally.invited).toBeGreaterThan(0);
			}
		}
	});

	it('points out a split in the crowd that follows the box’s bias towards large CVs', () => {
		// The crowd of the "corner nobody checked" screen: a larger size served, a smaller one overlooked.
		for (const persona of PERSONAS) {
			for (const colour of COLOURS) {
				const { pool, outcomes } = scenarioFor(persona, colour);
				const crowd = multiplyPool(pool, outcomes.parity.invitedIds, {
					factor: CROWD_FACTOR,
					palette: ['#0072b2'],
					random: () => 0,
					sizeOf: crowdSizeOf
				});
				const found = sharpestSplit(tallyIntersections(crowd.pool, crowd.invitedIds));
				expect(found).toBeDefined();
				const { favoured, overlooked } = found!;
				expect(overlooked.tally.invited).toBe(0);
				expect(SIZES.indexOf(favoured.size)).toBeGreaterThan(SIZES.indexOf(overlooked.size));
			}
		}
	});
});
