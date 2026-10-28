import { describe, expect, it } from 'vitest';
import { scoreDistributions } from '$lib/domain/candidates';
import { buildPool } from '$lib/domain/candidates';
import { crowdSizeOf, PERSONAS } from './personas';

describe('PERSONAS', () => {
	it('never makes a participant medium-sized', () => {
		expect(PERSONAS.filter((p) => p.size === 'medium')).toEqual([]);
	});

	it('brings the medium-sized back in the crowd only', () => {
		const pool = buildPool(
			PERSONAS,
			PERSONAS[0]!,
			{ id: 'green', hex: '#000', scoreModifier: 0 },
			['#111'],
			() => 0
		);
		expect(pool.filter((c) => crowdSizeOf(c) === 'medium').map((c) => c.id)).toEqual([
			'p05',
			'p17',
			'p18',
			'p19'
		]);
	});

	it('keeps the box’s bias towards large CVs', () => {
		const mean = (scores: readonly number[]) => scores.reduce((a, b) => a + b, 0) / scores.length;
		const { size } = scoreDistributions(PERSONAS);
		expect(mean(size.large)).toBeGreaterThan(mean(size.small));
	});
});
