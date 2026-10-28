<!--
	A score popping out of what was just chosen: it starts on top of its
	positioned parent, holds there a moment to be read, then rises and grows
	until it fades out around the middle of the screen. Calls `ondone` once it
	is gone (with reduced motion: after the same time, without the motion).
-->
<script lang="ts" module>
	/** How long the score shows before `ondone`: the length of the animation. */
	export const SCORE_FLOAT_MS = 3200;
</script>

<script lang="ts">
	import { onMount, type Snippet } from 'svelte';

	let { ondone, children }: { ondone: () => void; children: Snippet } = $props();

	onMount(() => {
		const timer = setTimeout(() => ondone(), SCORE_FLOAT_MS);
		return () => clearTimeout(timer);
	});
</script>

<span class="score-float" role="status" style:--float-ms="{SCORE_FLOAT_MS}ms">
	{@render children()}
</span>

<style>
	.score-float {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 10;
		font-size: 1.375rem;
		pointer-events: none;
		transform: translate(-50%, -50%);
		animation: score-float var(--float-ms) var(--ease-out) forwards;
	}

	@keyframes score-float {
		0% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.5);
		}
		8% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1.15);
		}
		14% {
			transform: translate(-50%, -50%) scale(1);
		}
		/* Hold in place so it can be read before it starts moving. */
		38% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		85% {
			opacity: 1;
		}
		100% {
			opacity: 0;
			transform: translate(-50%, calc(-50% - 38vh)) scale(3);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.score-float {
			animation: none !important;
			transform: translate(-50%, -50%) scale(1.3);
		}
	}
</style>
