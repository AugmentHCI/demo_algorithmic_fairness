<!--
	"Je bent meer dan één groep": three overlapping groups (shape, size, colour)
	with the participant standing where all three cross. The groups you were
	given are drawn neutral and dashed, the one you chose in your own colour.
-->
<script lang="ts">
	import type { Shape } from '$lib/domain/types';
	import ShapeGlyph from '../ShapeGlyph.svelte';

	interface Group {
		/** What kind of group, e.g. "vorm". */
		readonly kind: string;
		/** Which one, e.g. "driehoek". */
		readonly value: string;
	}

	interface Props {
		shape: Group;
		size: Group;
		colour: Group;
		you: { shape: Shape; fill: string };
		/** Accessible description of the whole diagram. */
		label: string;
	}

	let { shape, size, colour, you, label }: Props = $props();

	// Geometry in viewBox units: two circles on top with their labels above them,
	// one below with its label underneath. `CENTRE` is where all three overlap.
	const VIEW = { width: 260, height: 262 };
	const RADIUS = 60;
	const CENTRE = { x: 130, y: 125 };
	const GIVEN_COLOUR = '#5a5245';

	const circles = $derived([
		{ group: shape, cx: 100, cy: 108, labelX: 76, labelY: 16, fill: GIVEN_COLOUR, given: true },
		{ group: size, cx: 160, cy: 108, labelX: 184, labelY: 16, fill: GIVEN_COLOUR, given: true },
		{ group: colour, cx: 130, cy: 160, labelX: 130, labelY: 238, fill: you.fill, given: false }
	]);
</script>

<div class="venn" style:aspect-ratio="{VIEW.width} / {VIEW.height}">
	<svg viewBox="0 0 {VIEW.width} {VIEW.height}" role="img" aria-label={label}>
		{#each circles as circle, index (index)}
			<g class="group" style:animation-delay="{index * 160}ms">
				<circle
					cx={circle.cx}
					cy={circle.cy}
					r={RADIUS}
					fill={circle.fill}
					fill-opacity={circle.given ? 0.1 : 0.3}
					stroke={circle.fill}
					stroke-opacity="0.6"
					stroke-width="2"
					stroke-dasharray={circle.given ? '5 5' : undefined}
				/>
				<text x={circle.labelX} y={circle.labelY}>
					<tspan class="kind">{circle.group.kind}</tspan>
					<tspan class="value" x={circle.labelX} dy="17">{circle.group.value}</tspan>
				</text>
			</g>
		{/each}
	</svg>

	<span
		class="you"
		style:left="{(CENTRE.x / VIEW.width) * 100}%"
		style:top="{(CENTRE.y / VIEW.height) * 100}%"
		aria-hidden="true"
	>
		<ShapeGlyph shape={you.shape} fill={you.fill} px={52} face="happy" />
	</span>
</div>

<style>
	.venn {
		position: relative;
		width: min(100%, 17rem);
		margin-inline: auto;
	}

	svg {
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.group {
		transform-box: fill-box;
		transform-origin: center;
		animation: appear 600ms var(--ease-out) both;
	}

	text {
		text-anchor: middle;
		fill: var(--ink);
	}

	.kind {
		font-size: 12px;
		fill: var(--muted);
	}

	.value {
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 700;
	}

	.you {
		position: absolute;
		translate: -50% -50%;
		line-height: 0;
		animation: pop 700ms var(--ease-out) 500ms both;
	}

	@keyframes appear {
		from {
			opacity: 0;
			scale: 0.85;
		}
	}

	@keyframes pop {
		0% {
			opacity: 0;
			scale: 0.3;
		}
		70% {
			scale: 1.1;
		}
	}
</style>
