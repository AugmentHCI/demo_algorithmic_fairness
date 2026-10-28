<!--
	"De doos": the hiring algorithm as a closed black box. Lucide's isometric box,
	filled dark, with a slot on top for the CVs and a question mark on its side.
-->
<script lang="ts" module>
	// Lucide's box spans x 3–21 and y 2–22 of its 24×24 grid; the side faces
	// slope at 30°, so the question mark is skewed to sit flat on the left face.
	const VIEW_BOX = { x: 2, y: 1, width: 20, height: 22 };
	const SLOT_CENTRE = { x: 12, y: 7.1 };

	/** Where the CV slot sits, as fractions of the rendered box's width and height. */
	export const BOX_SLOT = {
		x: (SLOT_CENTRE.x - VIEW_BOX.x) / VIEW_BOX.width,
		y: (SLOT_CENTRE.y - VIEW_BOX.y) / VIEW_BOX.height
	} as const;
</script>

<script lang="ts">
	import BoxIcon from '@lucide/svelte/icons/box';

	interface Props {
		width?: number;
		/** Shakes while the box "computes". */
		busy?: boolean;
		/** Wobbles now and then, as if something is going on inside. */
		restless?: boolean;
		/** Glows as a drop target while a CV is dragged over it. */
		active?: boolean;
	}

	let { width = 96, busy = false, restless = false, active = false }: Props = $props();
</script>

<BoxIcon
	class={['black-box', { busy, restless, active }]}
	{width}
	height={width * (VIEW_BOX.height / VIEW_BOX.width)}
	viewBox="{VIEW_BOX.x} {VIEW_BOX.y} {VIEW_BOX.width} {VIEW_BOX.height}"
	color="#8a8070"
	fill="var(--ink)"
	strokeWidth={0.6}
	aria-hidden="true"
>
	<g stroke="none" fill="#fff">
		<polygon points="12,3.3 18.9,7.1 12,10.9 5.1,7.1" opacity="0.12" />
		<polygon points="12.9,12.6 20,8.6 20,16.3 12.9,20.3" opacity="0.05" />
	</g>
	<line class="slot" x1="9.9" y1="5.9" x2="14.1" y2="8.3" stroke-width="1.1" />
	<text class="mark" transform="matrix(1 0.577 0 1 7.7 14)" text-anchor="middle">?</text>
</BoxIcon>

<style>
	:global(svg.black-box) {
		flex: none;
		overflow: visible;
		transition:
			filter 200ms,
			scale 200ms var(--ease-out);
	}

	:global(svg.black-box.active) {
		filter: drop-shadow(0 0 10px rgb(232 83 15 / 55%));
		scale: 1.06;
	}

	:global(svg.black-box.busy) {
		animation: shake 0.3s ease-in-out infinite;
	}

	:global(svg.black-box.restless:not(.busy)) {
		animation: nudge 5s ease-in-out 1.5s infinite;
	}

	.slot {
		stroke: #0b0906;
		transition: stroke 200ms;
	}

	:global(svg.black-box.active) .slot {
		stroke: var(--accent);
	}

	.mark {
		font-family: var(--font-display);
		font-size: 7.5px;
		font-weight: 800;
		fill: #fff;
		stroke: none;
		dominant-baseline: central;
	}

	:global(svg.black-box.busy) .mark {
		animation: pulse 0.6s ease-in-out infinite;
	}

	@keyframes shake {
		0%,
		100% {
			transform: rotate(0);
		}
		25% {
			transform: rotate(-2.5deg);
		}
		75% {
			transform: rotate(2.5deg);
		}
	}

	/* A short wobble, then a long rest. */
	@keyframes nudge {
		0%,
		12%,
		100% {
			transform: rotate(0);
		}
		3% {
			transform: rotate(-3deg);
		}
		6% {
			transform: rotate(3deg);
		}
		9% {
			transform: rotate(-1.5deg);
		}
	}

	@keyframes pulse {
		50% {
			fill: var(--accent);
		}
	}
</style>
