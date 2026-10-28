<!--
	The CV that is dragged into the box (see state/cvDrop.svelte.ts). It nudges
	towards the box to invite a drag and shrinks into the box when sent. Once the
	box has handed out its score, the CV comes back out to its place.
-->
<script lang="ts">
	import { draggable } from '@neodrag/svelte';
	import type { Snippet } from 'svelte';
	import type { CvDrop } from '$lib/state/cvDrop.svelte';

	let { drop, children }: { drop: CvDrop; children: Snippet } = $props();
</script>

<div
	class="cv"
	class:animated={!drop.dragging}
	class:draggable={drop.canDrag}
	class:in-box={drop.busy}
	bind:this={drop.cv}
	use:draggable={drop.dragOptions}
	aria-hidden="true"
>
	<div class="cv-inner">{@render children()}</div>
</div>

<style>
	.cv {
		position: relative;
		z-index: 2;
		touch-action: none;
	}

	.draggable {
		cursor: grab;
	}

	.draggable:active {
		cursor: grabbing;
	}

	.animated {
		transition: transform 450ms var(--ease-out);
	}

	.cv-inner {
		transition:
			transform 450ms var(--ease-out),
			opacity 450ms;
	}

	.draggable .cv-inner {
		animation: invite 1.8s ease-in-out 1s 2;
	}

	.in-box .cv-inner {
		transform: scale(0.3);
		opacity: 0;
	}

	@keyframes invite {
		50% {
			transform: translate(10px, 12px);
		}
	}
</style>
