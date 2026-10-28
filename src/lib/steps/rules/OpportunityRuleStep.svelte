<!--
	Thermometer 3, "even vaak gevonden" (equal opportunity): among candidates who
	turned out to be suitable, every shape gets the same chance. The screen reads
	in two numbered parts: first the confusion matrix, showing where the box goes
	wrong and which row this thermometer looks at; then what the rule changes:
	the algorithm's ranking loses the unsuitable applicants, is grouped per shape
	with the algorithm's own choice, and only then moves to the thermometer's.
-->
<script lang="ts">
	import Callout from '$lib/components/Callout.svelte';
	import CandidateRows from '$lib/components/CandidateRows.svelte';
	import ConfusionMatrix from '$lib/components/ConfusionMatrix.svelte';
	import RichText from '$lib/components/RichText.svelte';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { confusionCellOf } from '$lib/domain/confusion';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);
</script>

{#snippet heading(number: number, text: string, id: string)}
	<h2 {id}><span class="number" aria-hidden="true">{number}</span>{text}</h2>
{/snippet}

{#if journey.scenario}
	{@const { pool, outcomes, you } = journey.scenario}
	{@const qualified = pool.filter((c) => c.qualified)}
	{@const yourStatus = you.qualified ? t.opportunity.youQualified : t.opportunity.youNotQualified}
	{@const yourCell = confusionCellOf(you.qualified, outcomes.bare_box.youInvited)}
	<Screen title={t.opportunity.title}>
		<ThermometerCard thermometer="opportunity" />

		<section class="part" aria-labelledby="opportunity-matrix">
			{@render heading(1, t.opportunity.parts.matrix, 'opportunity-matrix')}
			<ConfusionMatrix {pool} invitedIds={outcomes.bare_box.invitedIds} />
			<p class="footnote muted">{t.opportunity.footnote}</p>
			{#if journey.mode === 'workshop'}
				<Callout text={t.opportunity.placeBlock(yourCell)} />
			{/if}
		</section>

		<section class="part" aria-labelledby="opportunity-rule">
			{@render heading(2, t.opportunity.parts.rule, 'opportunity-rule')}
			<p>
				<RichText text={t.opportunity.body} />
				<strong>{yourStatus}</strong>
			</p>
			<CandidateRows
				pool={qualified}
				invitedIds={outcomes.opportunity.invitedIds}
				groupByShape
				from={{ pool, invitedIds: outcomes.bare_box.invitedIds }}
				via={[{ pool: qualified, invitedIds: outcomes.bare_box.invitedIds, groupByShape: true }]}
			/>
		</section>

		{#snippet actions()}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.common.next}</Button>
			</AtScreenEnd>
		{/snippet}
	</Screen>
{/if}

<style>
	.part {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* The second part sets itself apart from the first, so the screen reads as two steps. */
	.part + .part {
		padding-top: var(--space-5);
		border-top: 1px solid var(--line);
	}

	h2 {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		font-size: 1.15rem;
	}

	.number {
		display: inline-grid;
		place-items: center;
		flex: none;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background: var(--accent-strong);
		color: #fff;
		font-size: 0.9rem;
	}

	.footnote {
		font-size: 0.85rem;
	}
</style>
