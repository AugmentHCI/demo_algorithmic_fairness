import { describe, expect, it } from 'vitest';
import { fitGlyphSize, type GlyphFit } from './fitGlyphs';

// Room for 10 glyphs of 28 px on one line, or 4 lines of 8 px.
const BOX: GlyphFit = { width: 298, height: 38, gap: 2, maxPx: 28, minPx: 8 };

const fitsInBox = (count: number, px: number) =>
	Math.floor((BOX.width + BOX.gap) / (px + BOX.gap)) *
		Math.max(1, Math.floor((BOX.height + BOX.gap) / (px + BOX.gap))) >=
	count;

describe('fitGlyphSize', () => {
	it('keeps the full size while the glyphs fit', () => {
		expect(fitGlyphSize(0, BOX)).toBe(28);
		expect(fitGlyphSize(5, BOX)).toBe(28);
		expect(fitGlyphSize(10, BOX)).toBe(28);
	});

	it('shrinks the glyphs, wrapping them into more lines, once they no longer fit', () => {
		const px = fitGlyphSize(60, BOX);
		expect(px).toBeLessThan(28);
		expect(fitsInBox(60, px)).toBe(true);
		expect(fitsInBox(60, px + 1)).toBe(false);
	});

	it('never shrinks as the count goes down', () => {
		let previous = BOX.minPx;
		for (let count = 200; count >= 0; count--) {
			const px = fitGlyphSize(count, BOX);
			expect(px).toBeGreaterThanOrEqual(previous);
			previous = px;
		}
	});

	it('stops at the minimum size when even that does not fit', () => {
		expect(fitGlyphSize(10_000, BOX)).toBe(8);
	});

	it('uses the full size for a box that is not measured yet', () => {
		expect(fitGlyphSize(60, { ...BOX, width: 0 })).toBe(28);
	});
});
