<!--
	A fairness thermometer in its identity colour (see data/thermometers.ts):
	Lucide's thermometer outline with animated mercury inside. The fill level is
	purely decorative.
-->
<script lang="ts">
	import ThermometerIcon from '@lucide/svelte/icons/thermometer';
	import { THERMOMETER_COLOURS } from '$lib/data/thermometers';
	import type { ThermometerId } from '$lib/domain/types';

	interface Props {
		thermometer: ThermometerId;
		/** Decorative fill level, 0–1. */
		level?: number;
		height?: number;
	}

	let { thermometer, level = 0.35, height = 80 }: Props = $props();

	// Geometry of Lucide's 24×24 thermometer: a tube from y≈3 down into a bulb
	// centred on (12, 18). The view box is cropped to the thermometer and its ticks.
	const VIEW_BOX = { x: 6, y: 1, width: 13, height: 22 };
	const MERCURY_TOP = 4.5;
	const MERCURY_BOTTOM = 15;
	const TICKS = [0.25, 0.5, 0.75];

	const levelY = (fraction: number) =>
		MERCURY_BOTTOM - (MERCURY_BOTTOM - MERCURY_TOP) * Math.min(1, Math.max(0, fraction));
	const colour = $derived(THERMOMETER_COLOURS[thermometer]);
	const top = $derived(levelY(level));
</script>

<ThermometerIcon
	class="fairness-thermometer"
	width={height * (VIEW_BOX.width / VIEW_BOX.height)}
	{height}
	viewBox="{VIEW_BOX.x} {VIEW_BOX.y} {VIEW_BOX.width} {VIEW_BOX.height}"
	color="var(--ink)"
	fill="var(--surface)"
	strokeWidth={1}
	aria-hidden="true"
>
	<g class="mercury" fill={colour} stroke="none">
		<rect x="11" y={top} width="2" height={18 - top} rx="1" />
		<circle cx="12" cy="18" r="2.6" />
	</g>
	{#each TICKS as tick (tick)}
		<line x1="15.6" x2="17.4" y1={levelY(tick)} y2={levelY(tick)} stroke-width="0.8" />
	{/each}
</ThermometerIcon>

<style>
	:global(svg.fairness-thermometer) {
		flex: none;
		overflow: visible;
	}

	.mercury {
		transform-box: fill-box;
		transform-origin: bottom;
		animation:
			rise 900ms var(--ease-out) both,
			breathe 3.2s ease-in-out 900ms infinite alternate;
	}

	@keyframes rise {
		from {
			transform: scaleY(0.25);
		}
	}

	@keyframes breathe {
		to {
			transform: scaleY(1.06);
		}
	}
</style>
