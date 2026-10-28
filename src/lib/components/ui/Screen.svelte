<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ScreenEnd, setScreenEnd } from '$lib/state/screenEnd.svelte';

	interface Props {
		/** Line breaks (`\n`) in the title are kept. A snippet for a title that needs markup. */
		title: string | Snippet;
		children?: Snippet;
		/**
		 * Call(s) to action, pinned to the bottom of the screen. Wrap the way
		 * onwards in `AtScreenEnd` to hold it back until the reader has scrolled
		 * to the end.
		 */
		actions?: Snippet;
	}

	let { title, children, actions }: Props = $props();

	const end = setScreenEnd(new ScreenEnd());
</script>

<section class="screen" aria-labelledby="step-title">
	<div class="content">
		<h1 id="step-title" tabindex="-1" data-step-heading>
			{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
		</h1>
		{@render children?.()}
		<div class="end" aria-hidden="true" {@attach end.marker}></div>
	</div>

	{#if actions}
		<div class="actions" data-sticky="bottom" {@attach end.bar}>{@render actions()}</div>
	{/if}
</section>

<style>
	.screen {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		flex: 1;
		padding: var(--space-3) var(--space-5) var(--space-6);
	}

	h1 {
		white-space: pre-line;
	}

	/* Marks the end of the content, right after its last part (undoing the gap before it). */
	.end {
		height: 1px;
		margin-top: calc(-1 * var(--space-5));
	}

	.actions {
		position: sticky;
		bottom: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		/* The padding below the actions, on top of the safe area. Read by `AtScreenEnd`. */
		--actions-padding-bottom: var(--space-5);
		padding: var(--space-3) var(--space-5)
			calc(var(--actions-padding-bottom) + env(safe-area-inset-bottom));
		background: linear-gradient(to bottom, rgb(255 255 255 / 0%), var(--surface) 30%);
	}
</style>
