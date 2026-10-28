/**
 * Seeded randomness, so "random" pictures look the same on every render, on
 * every device and on every replay.
 */

/** A pseudo-random generator (mulberry32) returning numbers in [0, 1). */
export function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

/** A shuffled copy of `items` (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j] as T, result[i] as T];
	}
	return result;
}
