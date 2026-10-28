<!--
	Thermometer 2, "gelijk deel": every shape gets interviews in proportion to its
	size. The applicants start out grouped per shape with the algorithm's own
	choice, so only those whom the thermometer invites or turns away move. At the
	table, the blocks line up per shape in the same order.
-->
<script lang="ts">
	import Callout from '$lib/components/Callout.svelte';
	import CandidateRows from '$lib/components/CandidateRows.svelte';
	import RichText from '$lib/components/RichText.svelte';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);
</script>

{#if journey.scenario}
	{@const { pool, outcomes, shapeRank } = journey.scenario}
	{@const gaining = outcomes.parity.shapesGainingInterviews}
	<Screen title={t.parity.title}>
		<ThermometerCard thermometer="parity" />

		<p class="muted">
			<RichText text={t.parity.body} />
			{gaining.length > 0 ? t.parity.wall(gaining) : t.parity.wallNoChange}
		</p>

		<CandidateRows
			{pool}
			invitedIds={outcomes.parity.invitedIds}
			groupByShape
			from={{ pool, invitedIds: outcomes.bare_box.invitedIds, groupByShape: true }}
		/>

		{#if journey.mode === 'workshop'}
			<Callout text={t.parity.placeBlock(shapeRank)} />
		{/if}

		{#snippet actions()}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.common.next}</Button>
			</AtScreenEnd>
		{/snippet}
	</Screen>
{/if}
