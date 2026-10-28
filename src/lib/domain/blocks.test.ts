import { describe, expect, it } from 'vitest';
import { PERSONAS } from '$lib/data/personas';
import { blocksOf, personasOfBlock, sameBlock } from './blocks';

describe('blocksOf', () => {
	const blocks = blocksOf(PERSONAS);

	it('offers every shape in both sizes participants can have, and no medium', () => {
		expect(blocks).toEqual([
			{ shape: 'circle', size: 'large' },
			{ shape: 'square', size: 'large' },
			{ shape: 'triangle', size: 'large' },
			{ shape: 'circle', size: 'small' },
			{ shape: 'square', size: 'small' },
			{ shape: 'triangle', size: 'small' }
		]);
	});

	it('leaves out blocks nobody has', () => {
		const squares = PERSONAS.filter((p) => p.shape === 'square' && p.size === 'large');
		expect(blocksOf(squares)).toEqual([{ shape: 'square', size: 'large' }]);
	});
});

describe('personasOfBlock', () => {
	it('splits the persona list over the blocks, without gaps or overlaps', () => {
		const groups = blocksOf(PERSONAS).map((block) => personasOfBlock(PERSONAS, block));
		expect(groups.every((group) => group.length > 0)).toBe(true);
		const ids = (personas: readonly { id: string }[]) => personas.map((p) => p.id).sort();
		expect(ids(groups.flat())).toEqual(ids(PERSONAS));
	});

	it('only returns personas with the block’s shape and size', () => {
		const block = { shape: 'triangle', size: 'small' } as const;
		for (const persona of personasOfBlock(PERSONAS, block)) {
			expect(sameBlock(persona, block)).toBe(true);
		}
	});

	it('returns nothing for a block nobody has', () => {
		expect(personasOfBlock(PERSONAS, { shape: 'circle', size: 'medium' })).toEqual([]);
	});
});
