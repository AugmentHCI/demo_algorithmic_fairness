<!-- The dashed orange arrow of the design, pointing right or down. Its dashes flow towards the tip, unless `still`. -->
<script lang="ts">
	interface Props {
		direction?: 'right' | 'down';
		length?: number;
		still?: boolean;
	}

	let { direction = 'right', length = 48, still = false }: Props = $props();
</script>

<svg
	class={['arrow', direction, { still }]}
	viewBox="0 0 {length} 12"
	width={length}
	height="12"
	fill="none"
	stroke="var(--accent)"
	stroke-width="2.5"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	<line class="shaft" x1="2" y1="6" x2={length - 4} y2="6" />
	<path d="M{length - 7} 1.5 L{length - 2} 6 L{length - 7} 10.5" />
</svg>

<style>
	.arrow {
		flex: none;
		overflow: visible;
	}

	.down {
		transform: rotate(90deg);
	}

	.shaft {
		stroke-dasharray: 1 6;
	}

	.arrow:not(.still) .shaft {
		animation: flow 900ms linear infinite;
	}

	@keyframes flow {
		to {
			stroke-dashoffset: -7;
		}
	}
</style>
