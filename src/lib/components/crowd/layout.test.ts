import { describe, expect, it } from 'vitest';
import { COLOURS } from '$lib/data/colours';
import { PERSONAS } from '$lib/data/personas';
import { multiplyPool } from '$lib/domain/crowd';
import { buildScenario } from '$lib/domain/scenario';
import { SHAPES } from '$lib/domain/types';
import { seededRandom } from '$lib/utils/random';
import { AVATAR, matrixLayout, scatterLayout, type Box, type Point } from './layout';

const crowdFor = (personaIndex: number, colourIndex = 0) => {
	const scenario = buildScenario({
		personas: PERSONAS,
		persona: PERSONAS[personaIndex]!,
		colour: COLOURS[colourIndex]!,
		palette: ['#000'],
		random: () => 0,
		slots: 6
	});
	return multiplyPool(scenario.pool, scenario.outcomes.parity.invitedIds, {
		factor: 5,
		palette: ['#000'],
		random: seededRandom(1)
	});
};

const closestPair = (points: readonly Point[]) => {
	let closest = Infinity;
	points.forEach((a, i) => {
		for (const b of points.slice(i + 1))
			closest = Math.min(closest, Math.hypot(a.x - b.x, a.y - b.y));
	});
	return closest;
};

const overlaps = (a: Box, b: Box) =>
	a.left < b.left + b.width &&
	b.left < a.left + a.width &&
	a.top < b.top + b.height &&
	b.top < a.top + a.height;

describe('matrixLayout', () => {
	const crowd = crowdFor(1);
	const layout = matrixLayout(crowd.pool, crowd.invitedIds, seededRandom(2));

	it('gives everyone a spot on the stage', () => {
		expect(layout.spots.size).toBe(crowd.pool.length);
		// Glyphs on the edge of the stage touch it, give or take rounding.
		const EPSILON = 1e-9;
		for (const { x, y } of layout.spots.values()) {
			expect(x).toBeGreaterThanOrEqual(AVATAR / 2 - EPSILON);
			expect(x).toBeLessThanOrEqual(100 - AVATAR / 2 + EPSILON);
			expect(y).toBeGreaterThanOrEqual(AVATAR / 2 - EPSILON);
			expect(y).toBeLessThanOrEqual(layout.height - AVATAR / 2 + EPSILON);
		}
	});

	it('puts the invited on the left of their cluster', () => {
		for (const shape of SHAPES) {
			for (const { size } of layout.columns) {
				const members = crowd.pool.filter((c) => c.shape === shape && c.size === size);
				const xs = (invited: boolean) =>
					members
						.filter((c) => crowd.invitedIds.has(c.id) === invited)
						.map((c) => layout.spots.get(c.id)!.x);
				expect(Math.max(...xs(true))).toBeLessThanOrEqual(Math.min(...xs(false)));
			}
		}
	});

	it('keeps people from overlapping', () => {
		expect(closestPair([...layout.spots.values()])).toBeGreaterThan(AVATAR * 0.9);
	});

	it('keeps clusters apart, for every participant', () => {
		for (const [p] of PERSONAS.entries()) {
			for (const [c] of COLOURS.entries()) {
				const people = crowdFor(p, c);
				const { clusters, columns } = matrixLayout(
					people.pool,
					people.invitedIds,
					seededRandom(p * 31 + c)
				);
				const boxes = SHAPES.flatMap((shape) => columns.map(({ size }) => clusters[shape][size]!));
				boxes.forEach((a, i) => {
					for (const b of boxes.slice(i + 1)) expect(overlaps(a, b)).toBe(false);
				});
			}
		}
	});

	it('is the same for the same seed', () => {
		const again = matrixLayout(crowd.pool, crowd.invitedIds, seededRandom(2));
		expect(again).toEqual(layout);
	});
});

describe('scatterLayout', () => {
	const crowd = crowdFor(0);
	const spots = scatterLayout(crowd.pool, 70, seededRandom(3));

	it('spreads everyone over the stage without stacking them', () => {
		expect(spots.size).toBe(crowd.pool.length);
		for (const { x, y } of spots.values()) {
			expect(x).toBeGreaterThan(0);
			expect(x).toBeLessThan(100);
			expect(y).toBeGreaterThan(0);
			expect(y).toBeLessThan(70);
		}
		expect(closestPair([...spots.values()])).toBeGreaterThan(AVATAR * 0.5);
	});
});
