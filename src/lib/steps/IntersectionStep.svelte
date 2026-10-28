<!-- "Je bent meer dan één groep": the participant sits in a shape, a size and a colour group at once. -->
<script lang="ts">
	import Guide from '$lib/components/Guide.svelte';
	import GroupVenn from '$lib/components/illustrations/GroupVenn.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);
</script>

{#if journey.persona && journey.colour}
	{@const persona = journey.persona}
	{@const colour = journey.colour}
	{@const colourName = t.colours[colour.id]}
	<Screen title={t.intersection.title}>
		<GroupVenn
			shape={{ kind: t.intersection.labels.shape, value: t.shapes[persona.shape] }}
			size={{ kind: t.intersection.labels.size, value: t.sizes[persona.size] }}
			colour={{ kind: t.intersection.labels.colour, value: colourName }}
			you={{ shape: persona.shape, fill: colour.hex }}
			label={t.intersection.diagram(persona.shape, persona.size, colourName)}
		/>

		<Guide mood="curious" talkKey="intersection">
			{#each t.intersection.body(persona.size, colourName) as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		</Guide>

		{#snippet actions()}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.intersection.cta}</Button>
			</AtScreenEnd>
		{/snippet}
	</Screen>
{/if}
