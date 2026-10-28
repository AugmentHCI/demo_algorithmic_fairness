<!-- A quiet round icon button that plays an animation again. -->
<script lang="ts">
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { getI18n } from '$lib/i18n/index.svelte';

	let { onclick }: { onclick: () => void } = $props();

	const i18n = getI18n();
</script>

<button
	type="button"
	class="replay"
	aria-label={i18n.t.candidates.replay}
	title={i18n.t.candidates.replay}
	{onclick}
>
	<RotateCcw size={18} aria-hidden="true" />
</button>

<style>
	.replay {
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 0;
		border-radius: 50%;
		background: transparent;
		color: var(--neutral-vote);
		cursor: pointer;
		transition: color 150ms;
	}

	.replay:active {
		color: var(--muted);
	}

	@media (hover: hover) {
		.replay:hover {
			color: var(--muted);
		}
	}
</style>
