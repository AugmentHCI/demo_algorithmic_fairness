import type { Colour, ColourId } from '$lib/domain/types';

/**
 * Colours participants can choose, with their score modifiers (hidden until the score screen).
 * Display names live in the i18n dictionaries.
 */
export const COLOURS: readonly Colour[] = [
	{ id: 'yellow', hex: '#E6A100', scoreModifier: 8 },
	{ id: 'green', hex: '#009E73', scoreModifier: 4 },
	{ id: 'blue', hex: '#0072B2', scoreModifier: -4 },
	{ id: 'red', hex: '#C0392B', scoreModifier: -8 }
];

/**
 * Colours for the other applicants in the illustrations: the same four, so the
 * world only ever shows colours a participant could have picked.
 * Purely visual: other applicants' scores come from the persona list.
 */
export const DISPLAY_PALETTE: readonly string[] = COLOURS.map((colour) => colour.hex);

const coloursById = new Map(COLOURS.map((colour) => [colour.id, colour]));

export function findColour(id: ColourId | null | undefined): Colour | undefined {
	return id ? coloursById.get(id) : undefined;
}
