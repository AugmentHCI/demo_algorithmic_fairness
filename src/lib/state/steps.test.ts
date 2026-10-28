import { describe, expect, it } from 'vitest';
import { chapterProgressOf, requirementsOf, STEPS_BY_MODE, type StepKind } from './steps';

const STEPS = STEPS_BY_MODE.workshop;
const indexOf = (kind: StepKind) => STEPS.findIndex((step) => step.kind === kind);

describe('STEPS_BY_MODE', () => {
	it('tells the same story in both modes, without a language screen in the solo version', () => {
		const story = STEPS.filter((step) => step.kind !== 'language');
		expect(STEPS_BY_MODE.solo).toEqual(story);
	});

	it('tells the whole story of the algorithm before asking for the block', () => {
		const start = indexOf('world');
		expect(STEPS.slice(start, start + 8).map((step) => step.kind)).toEqual([
			'world',
			'applicants',
			'blackBox',
			'algorithm',
			'preview',
			'identity',
			'colour',
			'score'
		]);
	});

	it('counts the chapter dashes up in the order the screens appear', () => {
		let previous = 0;
		for (const step of STEPS) {
			const progress = chapterProgressOf(step);
			if (!progress || 'rule' in step) continue;
			if (progress.current !== 1) expect(progress.current).toBe(previous + 1);
			previous = progress.current;
		}
	});
});

describe('requirementsOf', () => {
	it('asks for nothing before the block is chosen', () => {
		for (let i = 0; i <= indexOf('identity'); i++) expect(requirementsOf(STEPS, i)).toEqual([]);
	});

	it('needs the persona for the colour, and the colour from then on', () => {
		expect(requirementsOf(STEPS, indexOf('colour'))).toEqual(['persona']);
		expect(requirementsOf(STEPS, indexOf('score'))).toEqual(['persona', 'colour']);
		expect(requirementsOf(STEPS, indexOf('unaware'))).toEqual(['persona', 'colour', 'score']);
	});
});
