<!-- "Wat betekent dat nu in het echt?": maps the game attributes to real-life characteristics. -->
<script lang="ts">
	import Guide from '$lib/components/Guide.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);
</script>

<Screen title={t.reveal.title}>
	<Guide mood="thinking" talkKey="reveal">
		<p>{t.reveal.body}</p>
	</Guide>

	<dl class="mapping">
		{#each t.reveal.rows as row, index (row.label)}
			<div
				class="row"
				style:animation-delay="{index * 150}ms"
				style:--examples={row.examples.length}
			>
				<dt class="muted">{row.label}</dt>
				{#each row.examples as example (example)}
					<dd>{example}</dd>
				{/each}
			</div>
		{/each}
	</dl>

	{#snippet actions()}
		<AtScreenEnd>
			<Button onclick={() => journey.next()}>{t.reveal.cta}</Button>
		</AtScreenEnd>
	{/snippet}
</Screen>

<style>
	.mapping {
		margin: 0;
		padding: var(--space-1) var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-l);
		background: var(--card);
	}

	.row {
		display: grid;
		grid-template-columns: 1fr auto;
		column-gap: var(--space-4);
		row-gap: var(--space-1);
		padding-block: var(--space-3);
		animation: slide-in 500ms var(--ease-out) both;
	}

	.row + .row {
		border-top: 1.5px dashed var(--line);
	}

	/* Spans exactly its examples: a longer span would add an empty row and its gap. */
	dt {
		grid-row: span var(--examples);
		font-size: 0.95rem;
	}

	dd {
		grid-column: 2;
		margin: 0;
		font-weight: 700;
		line-height: 1.3;
		text-align: right;
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateX(-12px);
		}
	}
</style>
