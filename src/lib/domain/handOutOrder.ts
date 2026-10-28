import type { Persona } from './types';

/**
 * The order in which the persona box prefers personas, when several of a block
 * are in it.
 *
 * Participants who start together often take the same block, so personas
 * handed out after one another should have very different scores. We sort by
 * score and interleave the lower and upper half (low, high, low, high, …):
 * neighbours are always roughly half the score range apart, also within the
 * personas of one block.
 */
export function handOutOrder(personas: readonly Persona[]): Persona[] {
	const sorted = [...personas].sort(
		(a, b) => a.baseScore - b.baseScore || a.id.localeCompare(b.id)
	);
	const half = Math.ceil(sorted.length / 2);
	const low = sorted.slice(0, half);
	const high = sorted.slice(half);

	const order: Persona[] = [];
	for (let i = 0; i < half; i++) {
		const lowPersona = low[i];
		const highPersona = high[i];
		if (lowPersona) order.push(lowPersona);
		if (highPersona) order.push(highPersona);
	}
	return order;
}
