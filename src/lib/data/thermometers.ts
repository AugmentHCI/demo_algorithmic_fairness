import type { ThermometerId } from '$lib/domain/types';

/**
 * Each thermometer has its own colour so participants recognise it on every
 * screen (1 green, 2 blue, 3 orange, as in the design). The colour identifies
 * the metric; it never signals "good" or "bad".
 */
export const THERMOMETER_COLOURS: Readonly<Record<ThermometerId, string>> = {
	counterfactual: '#009E73',
	parity: '#0072B2',
	opportunity: '#D55E00'
};
