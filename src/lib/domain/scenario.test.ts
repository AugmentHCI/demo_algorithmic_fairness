import { describe, expect, it } from 'vitest';
import { COLOURS, findColour } from '$lib/data/colours';
import { findPersona, PERSONAS } from '$lib/data/personas';
import { seededRandom } from '$lib/utils/random';
import { SHAPES, type Colour, type Persona } from './types';
import { buildScenario, mostTellingAlternatives, outcomeChange, whatIf } from './scenario';

const colour = findColour('yellow')!;
/** No real colour is neutral; this one lets a test see the bare base score. */
const neutral: Colour = { id: 'green', hex: '#009e73', scoreModifier: 0 };
const palette = ['#0072b2', '#009e73'];
const scenarioFor = (persona: Persona, c: Colour = colour) =>
	buildScenario({ personas: PERSONAS, persona, colour: c, palette, random: () => 0, slots: 6 });

describe('buildScenario', () => {
	it('adds the colour modifier to the persona score and ranks the participant', () => {
		const scenario = scenarioFor(findPersona('p02')!); // large triangle, 64
		expect(scenario.you.score).toBe(72);
		expect(scenario.you.colour).toBe(colour.hex);
		expect(scenario.rank).toBe(8);
		expect(scenario.outcomes.bare_box.youInvited).toBe(false);
	});

	it('ranks the participant among their own shape', () => {
		// Triangles: p20 (89) and p01 (75) score above p02's 72; the other three below.
		expect(scenarioFor(findPersona('p02')!).shapeRank).toBe(3);
		expect(scenarioFor(findPersona('p20')!).shapeRank).toBe(1);
	});

	it('colours the other applicants the same, whoever you are', () => {
		const coloursFor = (persona: Persona) =>
			buildScenario({
				personas: PERSONAS,
				persona,
				colour,
				palette,
				random: seededRandom(7),
				slots: 6
			}).pool.filter((c) => c.id !== 'p01' && c.id !== 'p02');
		expect(coloursFor(findPersona('p01')!)).toEqual(coloursFor(findPersona('p02')!));
	});

	it('lets you fill in your persona’s spot: the same applicants, whoever you are', () => {
		const applicantsFor = (persona: Persona) =>
			scenarioFor(persona).pool.map(({ id, shape, size, qualified }) => ({
				id,
				shape,
				size,
				qualified
			}));
		const expected = PERSONAS.map(({ id, shape, size, qualified }) => ({
			id,
			shape,
			size,
			qualified
		}));
		for (const persona of PERSONAS) {
			expect(applicantsFor(persona)).toEqual(expected);
			expect(scenarioFor(persona).you.id).toBe(persona.id);
		}
	});

	it('reports which shapes gain interviews under parity', () => {
		const scenario = scenarioFor(findPersona('p02')!);
		expect(scenario.outcomes.parity.shapesGainingInterviews).toContain('circle');
		expect(scenario.outcomes.bare_box.shapesGainingInterviews).toEqual([]);
	});

	it('works for every persona and colour combination', () => {
		for (const persona of PERSONAS) {
			for (const c of COLOURS) {
				const scenario = scenarioFor(persona, c);
				expect(scenario.rank).toBeGreaterThanOrEqual(1);
				expect(scenario.rank).toBeLessThanOrEqual(PERSONAS.length);
			}
		}
	});
});

describe('whatIf', () => {
	const scenario = scenarioFor(findPersona('p04')!); // large circle, 34

	it('returns the current score when nothing changes', () => {
		expect(whatIf(scenario, {}).score).toBe(scenario.you.score);
	});

	it('shows that the box rewards squares over circles, enough to get an interview', () => {
		const result = whatIf(scenario, { shape: 'square' });
		expect(result.score).toBeGreaterThan(scenario.you.score);
		expect(result.youInvited).toBe(true);
		expect(result.pool.find((c) => c.isYou)?.shape).toBe('square');
	});

	it('always reports whole-number scores', () => {
		for (const shape of ['circle', 'square', 'triangle'] as const) {
			expect(Number.isInteger(whatIf(scenario, { shape, size: 'small' }).score)).toBe(true);
		}
	});

	it('keeps your standing within the new group, inside the scores that group got', () => {
		// p04 is the best circle; as a square it becomes the best square (90), plus its colour.
		expect(whatIf(scenario, { shape: 'square' }).score).toBe(90 + colour.scoreModifier);
		// p20 is the best triangle; as a circle it scores like the best circle (34), not higher.
		const bestTriangle = scenarioFor(findPersona('p20')!, neutral);
		expect(whatIf(bestTriangle, { shape: 'circle' }).score).toBe(34);
	});

	it('never leaves the range of scores the target group got in the dataset', () => {
		for (const persona of PERSONAS) {
			const scenario = scenarioFor(persona, neutral);
			for (const shape of SHAPES) {
				const scores = PERSONAS.filter((p) => p.shape === shape).map((p) => p.baseScore);
				const { score } = whatIf(scenario, { shape });
				expect(score).toBeGreaterThanOrEqual(Math.min(...scores));
				expect(score).toBeLessThanOrEqual(Math.max(...scores));
			}
		}
	});

	it('changes the score by exactly the colour difference when only the colour changes', () => {
		const blue = findColour('blue')!;
		expect(whatIf(scenario, { colour: blue }).score).toBe(
			scenario.you.score - colour.scoreModifier + blue.scoreModifier
		);
	});

	it('prefers an alternative that changes the interview outcome', () => {
		const triangle = scenarioFor(findPersona('p02')!); // 72, just outside the top 6
		const alternatives = mostTellingAlternatives(triangle, COLOURS);
		expect(alternatives.shape).toBe('square');
		expect(whatIf(triangle, { shape: alternatives.shape }).youInvited).toBe(true);
	});

	it('picks the alternatives with the largest impact', () => {
		const alternatives = mostTellingAlternatives(scenario, COLOURS);
		expect(alternatives.shape).toBe('square');
		expect(alternatives.colour.id).toBe('red');
	});
});

describe('outcomeChange', () => {
	it('describes every combination', () => {
		expect(outcomeChange(false, true)).toBe('nowIn');
		expect(outcomeChange(true, true)).toBe('stillIn');
		expect(outcomeChange(true, false)).toBe('nowOut');
		expect(outcomeChange(false, false)).toBe('stillOut');
	});
});
