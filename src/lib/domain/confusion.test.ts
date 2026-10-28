import { describe, expect, it } from 'vitest';
import { findColour } from '$lib/data/colours';
import { findPersona, PERSONAS } from '$lib/data/personas';
import { CONFUSION_CELLS, confusionCellOf, confusionMatrix, isCorrect } from './confusion';
import { buildScenario } from './scenario';

describe('confusionCellOf', () => {
	it('sets the box’s choice against who was suitable', () => {
		expect(confusionCellOf(true, true)).toBe('truePositive');
		expect(confusionCellOf(true, false)).toBe('falseNegative');
		expect(confusionCellOf(false, true)).toBe('falsePositive');
		expect(confusionCellOf(false, false)).toBe('trueNegative');
	});

	it('marks only the true cells as correct', () => {
		expect(CONFUSION_CELLS.filter(isCorrect)).toEqual(['truePositive', 'trueNegative']);
	});
});

describe('confusionMatrix', () => {
	const { pool, outcomes } = buildScenario({
		personas: PERSONAS,
		persona: findPersona('p02')!,
		colour: findColour('yellow')!,
		palette: ['#0072b2'],
		random: () => 0,
		slots: 6
	});
	const matrix = confusionMatrix(pool, outcomes.bare_box.invitedIds);

	it('puts every applicant in exactly one cell', () => {
		const ids = CONFUSION_CELLS.flatMap((cell) => matrix[cell].map((c) => c.id));
		expect(ids).toHaveLength(pool.length);
		expect(new Set(ids)).toEqual(new Set(pool.map((c) => c.id)));
	});

	it('splits the invited applicants over the left column', () => {
		expect(matrix.truePositive.length + matrix.falsePositive.length).toBe(
			outcomes.bare_box.invitedIds.size
		);
	});

	it('keeps each cell in ranking order', () => {
		for (const cell of CONFUSION_CELLS) {
			const scores = matrix[cell].map((c) => c.score);
			expect(scores).toEqual([...scores].sort((a, b) => b - a));
		}
	});
});
