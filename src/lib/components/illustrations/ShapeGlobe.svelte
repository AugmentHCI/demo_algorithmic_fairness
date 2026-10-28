<!--
	The "world of shapes" globe. Plain grey inhabitants with faces on the welcome
	screen; coloured inhabitants (and the participant in their chosen colour, the
	only one with a face) on the colour screen.
-->
<script lang="ts">
	import Earth from '@lucide/svelte/icons/earth';
	import type { Shape, Size } from '$lib/domain/types';
	import ShapeGlyph, { type Face } from '../ShapeGlyph.svelte';

	interface Props {
		coloured?: boolean;
		/** The participant, shown in the middle with a face. */
		you?: { shape: Shape; size: Size; fill?: string };
		size?: number;
	}

	let { coloured = false, you, size = 130 }: Props = $props();

	/** Inhabitants before they have chosen anything: no colour, no outline. */
	const PLAIN_FILL = '#ffffff';

	const INHABITANTS: readonly {
		shape: Shape;
		size: Size;
		fill: string;
		face: Face;
		x: number;
		y: number;
	}[] = [
		{ shape: 'circle', size: 'medium', fill: '#0072b2', face: 'smile', x: 28, y: 26 },
		{ shape: 'square', size: 'medium', fill: '#d55e00', face: 'neutral', x: 56, y: 24 },
		{ shape: 'triangle', size: 'medium', fill: '#009e73', face: 'happy', x: 28, y: 58 },
		{ shape: 'square', size: 'small', fill: '#e6a100', face: 'smile', x: 62, y: 52 },
		{ shape: 'circle', size: 'small', fill: '#cc79a7', face: 'happy', x: 46, y: 70 }
	];
</script>

<div class="globe" style:width="{size}px" style:height="{size}px" aria-hidden="true">
	<span class="map">
		<Earth {size} viewBox="1.5 1.5 21 21" color="#d6cfc2" strokeWidth={0.6} />
	</span>
	{#each INHABITANTS as inhabitant, i (i)}
		{#if !you || i !== 2}
			<span
				class="inhabitant"
				class:plain={!coloured}
				style:left="{inhabitant.x}%"
				style:top="{inhabitant.y}%"
				style:animation-delay="{-i * 0.8}s"
			>
				<ShapeGlyph
					shape={inhabitant.shape}
					size={inhabitant.size}
					fill={coloured ? inhabitant.fill : PLAIN_FILL}
					face={you ? undefined : inhabitant.face}
					px={size * 0.2}
				/>
			</span>
		{/if}
	{/each}
	{#if you}
		<span class="you">
			<ShapeGlyph shape={you.shape} size={you.size} fill={you.fill} px={size * 0.36} face="smile" />
		</span>
	{/if}
</div>

<style>
	.globe {
		position: relative;
		margin-inline: auto;
	}

	.map {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: #eeebe4;
	}

	.inhabitant {
		position: absolute;
		translate: -50% -50%;
		animation: float 4s ease-in-out infinite alternate;
	}

	/* White on the pale map needs a soft shadow to stand out. */
	.inhabitant.plain {
		filter: drop-shadow(0 1px 2px rgb(90 82 69 / 35%));
	}

	.you {
		position: absolute;
		left: 50%;
		top: 52%;
		translate: -50% -50%;
		animation: pop 600ms var(--ease-out) both;
	}

	.you :global(svg *) {
		transition: fill 250ms;
	}

	@keyframes float {
		to {
			transform: translate(3px, -4px) rotate(6deg);
		}
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.4);
		}
	}
</style>
