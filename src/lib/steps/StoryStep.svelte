<!--
	A narrative screen: title, illustration, Pim explaining, and one call to action.
	In the body and the highlight, **double asterisks** mark bold text.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Guide, { type GuideMood } from '$lib/components/Guide.svelte';
	import RichText from '$lib/components/RichText.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';

	interface Props {
		title: string;
		body: string | readonly string[];
		cta: string;
		mood?: GuideMood;
		/** A key takeaway shown below Pim. */
		highlight?: string;
		illustration?: Snippet;
		onNext: () => void;
	}

	let { title, body, cta, mood = 'happy', highlight, illustration, onNext }: Props = $props();

	const paragraphs = $derived(typeof body === 'string' ? [body] : body);
</script>

<Screen {title}>
	{#if illustration}
		<div class="illustration">{@render illustration()}</div>
	{/if}

	<Guide {mood} talkKey={title}>
		{#each paragraphs as paragraph (paragraph)}
			<p><RichText text={paragraph} /></p>
		{/each}
	</Guide>

	{#if highlight}
		<Callout text={highlight} />
	{/if}

	{#snippet actions()}
		<AtScreenEnd>
			<Button onclick={onNext}>{cta}</Button>
		</AtScreenEnd>
	{/snippet}
</Screen>

<style>
	.illustration {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-3);
		min-height: 7rem;
	}
</style>
