import { describe, expect, it } from 'vitest';
import { findColour } from '$lib/data/colours';
import { crowdSizeOf, findPersona, PERSONAS } from '$lib/data/personas';
import { multiplyPool } from './crowd';
import { tallyIntersections } from './intersections';
import { buildScenario } from './scenario';
import { SHAPES, SIZES, type Persona } from './types';

const scenario = buildScenario({
	personas: PERSONAS,
	persona: findPersona('p02')!,
	colour: findColour('yellow')!,
	palette: ['#0072b2'],
	random: () => 0,
	slots: 6
});
const { pool, outcomes } = scenario;
const options = { factor: 5, palette: ['#111', '#222'], random: () => 0.75 };

describe('multiplyPool', () => {
	const crowd = multiplyPool(pool, outcomes.parity.invitedIds, options);

	it('makes every applicant stand for `factor` people, with unique ids', () => {
		expect(crowd.pool).toHaveLength(pool.length * 5);
		expect(new Set(crowd.pool.map((c) => c.id)).size).toBe(crowd.pool.length);
		expect(crowd.invitedIds.size).toBe(outcomes.parity.invitedIds.size * 5);
	});

	it('scales every subgroup tally by the same factor', () => {
		const small = tallyIntersections(pool, outcomes.parity.invitedIds);
		const large = tallyIntersections(crowd.pool, crowd.invitedIds);
		for (const shape of SHAPES) {
			for (const size of SIZES) {
				const { invited, total } = small.cells[shape][size];
				expect(large.cells[shape][size]).toEqual({ invited: invited * 5, total: total * 5 });
			}
		}
	});

	it('keeps you once, in your own colour, and colours the look-alikes from the palette', () => {
		expect(crowd.pool.filter((c) => c.isYou)).toEqual([scenario.you]);
		const lookAlikes = crowd.pool.filter((c) => !pool.includes(c));
		expect(lookAlikes.every((c) => c.colour === '#222')).toBe(true);
	});

	it('gives the look-alikes the crowd size, but keeps every real persona, you too, at its own', () => {
		const medium = multiplyPool(pool, outcomes.parity.invitedIds, {
			...options,
			sizeOf: () => 'medium'
		});
		for (const person of medium.pool) {
			expect(person.size).toBe(pool.includes(person) ? person.size : 'medium');
		}
		expect(medium.pool.filter((c) => pool.includes(c))).toEqual(pool);
		expect(medium.invitedIds).toEqual(crowd.invitedIds);
	});

	it('holds the same number of each shape and size, whoever you are', () => {
		const totalsFor = (persona: Persona) => {
			const own = buildScenario({
				personas: PERSONAS,
				persona,
				colour: findColour('yellow')!,
				palette: ['#0072b2'],
				random: () => 0,
				slots: 6
			});
			const { pool: people } = multiplyPool(own.pool, own.outcomes.parity.invitedIds, {
				...options,
				sizeOf: crowdSizeOf
			});
			const totals = tallyIntersections(people, new Set()).cells;
			return SHAPES.flatMap((shape) => SIZES.map((size) => totals[shape][size].total));
		};
		const expected = totalsFor(PERSONAS[0]!);
		for (const persona of PERSONAS) expect(totalsFor(persona)).toEqual(expected);
	});

	it('rejects a factor that is not a positive whole number', () => {
		expect(() => multiplyPool(pool, new Set(), { ...options, factor: 0 })).toThrow();
		expect(() => multiplyPool(pool, new Set(), { ...options, factor: 2.5 })).toThrow();
	});
});
