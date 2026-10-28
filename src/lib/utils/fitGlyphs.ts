/** The box a row of glyphs has to fit in, and how the glyphs may be sized. */
export interface GlyphFit {
	/** Available width and height in px. */
	readonly width: number;
	readonly height: number;
	/** Gap between glyphs, horizontally and vertically, in px. */
	readonly gap: number;
	/** The size glyphs have while there is room for it. */
	readonly maxPx: number;
	/** Glyphs never get smaller than this, even if they then no longer fit. */
	readonly minPx: number;
}

/** How many square glyphs of `px` (with `gap` between them) fit along `length`. */
const fitAlong = (length: number, px: number, gap: number) =>
	Math.floor((length + gap) / (px + gap));

/**
 * The largest whole-pixel size at which `count` square glyphs, wrapping into
 * lines, fit in the box: `maxPx` while they fit at that size, smaller as they
 * get more, and `minPx` once even that is too big. A box that is not measured
 * yet (zero width) gets `maxPx`.
 */
export function fitGlyphSize(count: number, fit: GlyphFit): number {
	const { width, height, gap, maxPx, minPx } = fit;
	if (width <= 0) return maxPx;
	for (let px = maxPx; px > minPx; px--) {
		const lines = Math.max(1, fitAlong(height, px, gap));
		if (fitAlong(width, px, gap) * lines >= count) return px;
	}
	return minPx;
}
