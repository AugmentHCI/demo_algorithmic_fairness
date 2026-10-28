<!--
	A shape from the "world of shapes": circle, square or triangle, in a size and
	colour, optionally with a (blinking) face. The participant's own shape always
	has a face, so it doubles as their little avatar.
-->
<script lang="ts" module>
	import type { Shape, Size } from '$lib/domain/types';

	export type Face = 'happy' | 'smile' | 'neutral' | 'sad';

	// Geometry in viewBox units (0–100), shared by the drawing and `glyphGeometry`.
	const SCALE: Record<Size, number> = { small: 0.6, medium: 0.8, large: 1 };
	const EYE_OFFSET = -6;

	const radiusOf = (size: Size) => 42 * SCALE[size];

	/** Faces sit lower in a triangle, where there is more room. */
	function faceOf(shape: Shape, size: Size): { y: number; scale: number } {
		const r = radiusOf(size);
		return shape === 'triangle'
			? { y: 50 + r * 0.32, scale: (r / 42) * 0.85 }
			: { y: 50, scale: r / 42 };
	}

	/** Vertical positions within the glyph's box, as fractions of its height from the top. */
	export interface GlyphGeometry {
		readonly top: number;
		readonly bottom: number;
		readonly eyes: number;
	}

	/** Where a glyph's shape and eyes are, so illustrations can stand it on a line or a crate. */
	export function glyphGeometry(shape: Shape, size: Size = 'large'): GlyphGeometry {
		const r = radiusOf(size);
		const halfHeight = shape === 'square' ? r * 0.88 : r;
		const bottom = shape === 'triangle' ? 50 + r * 0.8 : 50 + halfHeight;
		const face = faceOf(shape, size);
		return {
			top: (50 - halfHeight) / 100,
			bottom: bottom / 100,
			eyes: (face.y + EYE_OFFSET * face.scale) / 100
		};
	}
</script>

<script lang="ts">
	interface Props {
		shape: Shape;
		size?: Size;
		/** Fill colour; `undefined` draws an outline only. */
		fill?: string;
		/** Rendered box size in px (the shape scales inside it by `size`). */
		px?: number;
		face?: Face;
		/** Accessible name; when omitted the glyph is decorative. */
		label?: string;
		stroke?: string;
	}

	let { shape, size = 'large', fill, px = 48, face, label, stroke }: Props = $props();

	const r = $derived(radiusOf(size));
	const outline = $derived(stroke ?? (fill ? 'none' : '#5a5245'));

	const MOUTHS: Record<Face, string> = {
		happy: 'M-9 3 Q0 13 9 3 Z',
		smile: 'M-8 4 Q0 11 8 4',
		neutral: 'M-7 6 L7 6',
		sad: 'M-8 9 Q0 2 8 9'
	};
	const placement = $derived(faceOf(shape, size));
</script>

<svg
	viewBox="0 0 100 100"
	width={px}
	height={px}
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : 'true'}
>
	{#if shape === 'circle'}
		<circle cx="50" cy="50" {r} fill={fill ?? 'none'} stroke={outline} stroke-width="6" />
	{:else if shape === 'square'}
		<rect
			x={50 - r * 0.88}
			y={50 - r * 0.88}
			width={r * 1.76}
			height={r * 1.76}
			rx="6"
			fill={fill ?? 'none'}
			stroke={outline}
			stroke-width="6"
		/>
	{:else}
		<polygon
			points="50,{50 - r} {50 + r * 1.05},{50 + r * 0.8} {50 - r * 1.05},{50 + r * 0.8}"
			fill={fill ?? 'none'}
			stroke={outline}
			stroke-width="6"
			stroke-linejoin="round"
		/>
	{/if}

	{#if face}
		<g transform="translate(50 {placement.y}) scale({placement.scale})" class="face">
			<g class="eyes">
				<circle cx="-8" cy={EYE_OFFSET} r="3.6" fill="#1d1811" />
				<circle cx="8" cy={EYE_OFFSET} r="3.6" fill="#1d1811" />
			</g>
			<path
				d={MOUTHS[face]}
				fill={face === 'happy' ? '#1d1811' : 'none'}
				stroke="#1d1811"
				stroke-width="3.2"
				stroke-linecap="round"
			/>
		</g>
	{/if}
</svg>

<style>
	svg {
		flex: none;
		overflow: visible;
	}

	.eyes {
		transform-box: fill-box;
		transform-origin: center;
		animation: blink 5s infinite;
	}

	@keyframes blink {
		0%,
		94%,
		100% {
			transform: scaleY(1);
		}
		97% {
			transform: scaleY(0.1);
		}
	}
</style>
