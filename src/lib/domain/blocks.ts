import { SHAPES, SIZES, type Persona, type Shape, type Size } from './types';

/**
 * A wooden block handed out at the table: a shape in a size. Participants tell
 * the app which block they got; several personas can share the same block.
 */
export interface Block {
	readonly shape: Shape;
	readonly size: Size;
}

export function sameBlock(a: Block, b: Block): boolean {
	return a.shape === b.shape && a.size === b.size;
}

/** A stable name for a block, like `small-circle`; also the persona box's lock key in the database. */
export function blockKey(block: Block): string {
	return `${block.size}-${block.shape}`;
}

/** Every block someone in `personas` has: grouped by size (largest first), then by shape. */
export function blocksOf(personas: readonly Persona[]): Block[] {
	const largestFirst = [...SIZES].reverse();
	return largestFirst.flatMap((size) =>
		SHAPES.map((shape): Block => ({ shape, size })).filter((block) =>
			personas.some((persona) => sameBlock(persona, block))
		)
	);
}

/** The personas `block` can stand for, in the order of `personas`. */
export function personasOfBlock<P extends Persona>(personas: readonly P[], block: Block): P[] {
	return personas.filter((persona) => sameBlock(persona, block));
}
