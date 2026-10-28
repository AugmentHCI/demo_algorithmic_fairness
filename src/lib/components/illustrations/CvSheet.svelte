<!--
	A CV: a page with a folded corner, a photo, a name and a few sections of text.
	Yours has an orange border, the "jouw cv" tag and your shape as its photo; the
	photo pops whenever the shape, size or colour changes.
-->
<script lang="ts">
	import { backOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import type { Shape, Size } from '$lib/domain/types';
	import ShapeGlyph from '../ShapeGlyph.svelte';

	interface Props {
		label?: string;
		shape?: Shape;
		size?: Size;
		fill?: string;
		tilt?: number;
		width?: number;
		/** A plain grey sheet from the pile. */
		plain?: boolean;
	}

	let { label, shape, size, fill, tilt = -8, width = 76, plain = false }: Props = $props();

	/** Text lines of the two sections, as [y, width] in the 80×100 page. */
	const SECTIONS = [
		{
			heading: [44, 22],
			lines: [
				[51, 60],
				[57, 52],
				[63, 56]
			]
		},
		{
			heading: [73, 16],
			lines: [
				[80, 58],
				[86, 44]
			]
		}
	] as const;

	/** Changes whenever the photo should pop. */
	const avatarKey = $derived(`${shape}-${size}-${fill}`);
</script>

<div class="sheet" class:plain style:width="{width}px" style:rotate="{tilt}deg" aria-hidden="true">
	<svg class="page" viewBox="0 0 80 100">
		<path
			class="paper"
			d="M7 1.5 H61 L78.5 19 V93 a5.5 5.5 0 0 1 -5.5 5.5 H7 a5.5 5.5 0 0 1 -5.5 -5.5 V7 a5.5 5.5 0 0 1 5.5 -5.5 Z"
		/>
		<path class="fold" d="M61 1.5 V14 a5 5 0 0 0 5 5 H78.5" />

		<circle class="photo" cx="20" cy="22" r="12" />
		<rect class="name" x="36" y="15" width="24" height="4.5" rx="2.25" />
		<rect class="text" x="36" y="24" width="18" height="3" rx="1.5" />

		{#each SECTIONS as section, i (i)}
			<rect
				class="heading"
				x="10"
				y={section.heading[0]}
				width={section.heading[1]}
				height="3.2"
				rx="1.6"
			/>
			{#each section.lines as [y, lineWidth] (y)}
				<rect class="text" x="10" {y} width={lineWidth} height="2.6" rx="1.3" />
			{/each}
		{/each}
	</svg>

	{#if shape}
		<span class="avatar">
			{#key avatarKey}
				<span
					class="glyph"
					in:scale={{ start: 0.2, duration: 450, easing: backOut }}
					out:fade={{ duration: 120 }}
				>
					<ShapeGlyph {shape} {size} {fill} px={width * 0.36} face="smile" />
				</span>
			{/key}
		</span>
	{/if}

	{#if label}<span class="label">{label}</span>{/if}
</div>

<style>
	.sheet {
		position: relative;
		flex: none;
		filter: drop-shadow(0 2px 5px rgb(29 24 17 / 12%));
	}

	.page {
		width: 100%;
		height: auto;
		overflow: visible;
	}

	.paper {
		fill: var(--surface);
		stroke: var(--accent);
		stroke-width: 2.5;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}

	.fold {
		fill: var(--accent-soft);
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}

	.photo {
		fill: var(--accent-soft);
	}

	.name,
	.heading {
		fill: var(--accent);
	}

	.text {
		fill: #ddd6ca;
	}

	.plain .paper {
		fill: #f4f1eb;
		stroke: #cfc8bb;
		stroke-width: 1.5;
	}

	.plain .fold {
		fill: #e5e0d6;
		stroke: #cfc8bb;
		stroke-width: 1.5;
	}

	.plain .photo,
	.plain .name,
	.plain .heading {
		fill: #ddd6ca;
	}

	.plain .text {
		fill: #e5e0d6;
	}

	/* Covers the photo circle (centre 20,22, radius 12) of the 80×100 page. */
	.avatar {
		position: absolute;
		left: 10%;
		top: 10%;
		display: grid;
		place-items: center;
		width: 30%;
		aspect-ratio: 1;
	}

	/* The old and new photo overlap while one pops in and the other fades out. */
	.glyph {
		grid-area: 1 / 1;
	}

	.label {
		position: absolute;
		left: 50%;
		bottom: 0;
		translate: -50% 50%;
		padding: 0.1rem 0.5rem;
		border-radius: 999px;
		background: var(--accent);
		color: #fff;
		font-size: 0.7rem;
		font-weight: 700;
		white-space: nowrap;
	}
</style>
