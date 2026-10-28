<!--
	Holds a screen's way onwards back until the reader has scrolled to the end
	of the screen, so it doesn't cover content before it is relevant. On a
	screen that fits, it is there straight away. Use it inside `Screen`'s
	actions, around the button that moves on to the next screen.

	When all content already shows but the end still sits behind the
	call-to-action bar, the top of the way onwards peeks out from the bottom
	edge of the screen, so it is clear there is more below. Tapping it
	scrolls there.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import { getScreenEnd } from '$lib/state/screenEnd.svelte';

	let { children }: { children: Snippet } = $props();

	const end = getScreenEnd();

	function scrollToEnd(): void {
		// The screen is the whole page, so its end is the bottom of the page.
		window.scrollTo({
			top: document.documentElement.scrollHeight,
			behavior: prefersReducedMotion.current ? 'auto' : 'smooth'
		});
	}
</script>

{#if end.reached}
	<div in:fly={{ y: 16, duration: end.fits || prefersReducedMotion.current ? 0 : 250 }}>
		{@render children()}
	</div>
{:else if end.near}
	<!-- A pointer-only shortcut: the peek is a hint, not a control, and scrolling reaches the same. -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div
		class="peek"
		onclick={scrollToEnd}
		in:fade={{ duration: prefersReducedMotion.current ? 0 : 150 }}
	>
		<div inert>{@render children()}</div>
	</div>
{/if}

<style>
	.peek {
		/* Just the top of the way onwards, cut off by the bottom edge of the screen. */
		height: 1.25rem;
		overflow: clip;
		/* Reach through the bar's bottom padding, down to that edge (or the safe area above it). */
		margin-bottom: calc(-1 * var(--actions-padding-bottom, 0px));
		cursor: pointer;
	}
</style>
