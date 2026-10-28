<!-- The frame of the participant pages: the whole screen on a phone, a card on wider screens. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="app">
	{@render children()}
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: var(--content-width);
		min-height: 100dvh;
		margin: 0 auto;
		background: var(--surface);
	}

	@media (min-width: 40rem) {
		.app {
			min-height: calc(100dvh - 4rem);
			margin-block: 2rem;
			border-radius: var(--radius-l);
			box-shadow: var(--shadow);
			overflow: clip;
		}
	}
</style>
