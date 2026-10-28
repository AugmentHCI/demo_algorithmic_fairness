import { describe, expect, it } from 'vitest';
import { PERSONAS } from '$lib/data/personas';
import { handOutOrder } from './handOutOrder';

describe('handOutOrder', () => {
	const order = handOutOrder(PERSONAS);

	it('contains every persona exactly once', () => {
		expect(order).toHaveLength(PERSONAS.length);
		expect(new Set(order.map((p) => p.id)).size).toBe(PERSONAS.length);
	});

	it('keeps neighbours far apart in score, including the wrap-around', () => {
		const range =
			Math.max(...PERSONAS.map((p) => p.baseScore)) - Math.min(...PERSONAS.map((p) => p.baseScore));
		order.forEach((persona, index) => {
			const next = order[(index + 1) % order.length]!;
			expect(Math.abs(persona.baseScore - next.baseScore)).toBeGreaterThanOrEqual(range / 3);
		});
	});

	it('handles lists with an odd length', () => {
		expect(handOutOrder(PERSONAS.slice(0, 5))).toHaveLength(5);
	});
});
