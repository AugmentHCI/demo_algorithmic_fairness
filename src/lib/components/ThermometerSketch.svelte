<!--
	A small, still reminder of how a thermometer felt at the stand, from this
	participant's own scenario: for thermometer 1 your CV, changed, going into
	the box again; for 2 half of the applicants per shape as 'gelijk deel'
	invites them, above the orange line, with each shape's share of invitations
	(of everyone) beside them; for 3 the matrix with the suitable row in focus.
	Kept compact so two cards fit on one screen. Decorative: the card it sits
	on names the thermometer.
-->
<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { rankPool } from '$lib/domain/candidates';
	import { confusionCellOf, confusionMatrix, isCorrect } from '$lib/domain/confusion';
	import type { Scenario, WhatIfChange } from '$lib/domain/scenario';
	import { SHAPES, type Candidate, type ThermometerId } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import Box3D from './illustrations/Box3D.svelte';
	import DottedArrow from './illustrations/DottedArrow.svelte';
	import ShapeGlyph from './ShapeGlyph.svelte';
	import ShareBars from './ShareBars.svelte';

	interface Props {
		thermometer: ThermometerId;
		scenario: Scenario;
		/** The change to your CV that thermometer 1 shows. */
		change: WhatIfChange;
	}

	let { thermometer, scenario, change }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t.opportunity.matrix);

	/** Every other one of `members`, always keeping you: half as many, spread like the whole. */
	function half(members: readonly Candidate[]): Candidate[] {
		return members.filter((c, i) => c.isYou || (i % 2 === 0 && !members[i + 1]?.isYou));
	}
</script>

{#snippet glyph(candidate: Candidate, px: number)}
	<ShapeGlyph
		shape={candidate.shape}
		size={candidate.size}
		fill={candidate.colour}
		face={candidate.isYou ? 'smile' : undefined}
		px={candidate.isYou ? px + 4 : px}
	/>
{/snippet}

<div class="sketch" aria-hidden="true">
	{#if thermometer === 'counterfactual'}
		{@const { you } = scenario}
		<div class="machine">
			<ShapeGlyph shape={you.shape} size={you.size} fill={you.colour} px={32} face="smile" />
			<ArrowRight size={16} color="var(--muted)" />
			<ShapeGlyph
				shape={change.shape ?? you.shape}
				size={change.size ?? you.size}
				fill={change.colour?.hex ?? you.colour}
				px={32}
				face="smile"
			/>
			<DottedArrow length={24} still />
			<Box3D width={48} />
		</div>
	{:else if thermometer === 'parity'}
		{@const invitedIds = scenario.outcomes.parity.invitedIds}
		{@const ranked = rankPool(scenario.pool)}
		{@const tallies = SHAPES.map((shape) => {
			const members = scenario.pool.filter((c) => c.shape === shape);
			const invited = members.filter((c) => invitedIds.has(c.id)).length;
			return { shape, total: members.length, before: invited, after: invited };
		})}
		<div class="parity">
			<!-- Per row: its mark, then a cell per shape; the invited row's line runs under all of them. -->
			<div class="columns">
				{#each [true, false] as invited (invited)}
					<span class={['mark', invited ? 'in' : 'out']}>
						{#if invited}
							<Check size={18} strokeWidth={3} />
						{:else}
							<X size={18} strokeWidth={3} />
						{/if}
					</span>
					{#each SHAPES as shape (shape)}
						<span class={['column', invited ? 'in' : 'out']}>
							{#each half(ranked.filter((c) => c.shape === shape && invitedIds.has(c.id) === invited)) as candidate (candidate.id)}
								{@render glyph(candidate, 14)}
							{/each}
						</span>
					{/each}
				{/each}
			</div>
			<ShareBars {tallies} changeMs={null} --bar-height="1.75rem" />
		</div>
	{:else}
		{@const matrix = confusionMatrix(scenario.pool, scenario.outcomes.bare_box.invitedIds)}
		<div class="matrix">
			<span></span>
			<span class="mark good"><Check size={14} strokeWidth={3} /></span>
			<span class="mark bad"><X size={14} strokeWidth={3} /></span>
			{#each [true, false] as qualified (qualified)}
				<span class={['label', { faded: !qualified }]}>
					{qualified ? t.qualified : t.notQualified}
				</span>
				{#each [true, false] as invited (invited)}
					{@const cell = confusionCellOf(qualified, invited)}
					<span class={['cell', isCorrect(cell) ? 'right' : 'wrong', { faded: !qualified }]}>
						{#each matrix[cell] as candidate (candidate.id)}
							{@render glyph(candidate, 12)}
						{/each}
					</span>
				{/each}
			{/each}
		</div>
	{/if}
</div>

<style>
	.machine {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
	}

	.parity {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.columns {
		display: grid;
		flex: 1;
		grid-template-columns: auto repeat(3, 1fr);
		min-width: 0;
	}

	.column {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		align-content: flex-start;
		gap: 3px 1px;
		padding: var(--space-1) var(--space-2);
	}

	/* The invited rest on the orange line, which runs unbroken under the whole row. */
	.column.in {
		flex-wrap: wrap-reverse;
	}

	.mark.in,
	.column.in {
		border-bottom: 2px solid var(--accent);
	}

	.column + .column {
		border-left: 1px solid var(--line);
	}

	.mark.in {
		display: flex;
		align-items: flex-end;
		padding: var(--space-1) var(--space-1) var(--space-1) 0;
		color: var(--good);
	}

	.mark.out {
		display: flex;
		padding: var(--space-1) var(--space-1) var(--space-1) 0;
		color: var(--accent);
	}

	.column.out {
		opacity: 0.45;
	}

	.matrix {
		display: grid;
		grid-template-columns: auto 1fr 1fr;
		align-items: center;
		gap: 4px;
	}

	.matrix .mark {
		display: flex;
		justify-content: center;
	}

	.mark.good {
		color: var(--good);
	}

	.mark.bad {
		color: var(--accent);
	}

	.label {
		font-size: 0.75rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.cell {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		align-self: stretch;
		gap: 1px;
		min-height: 1.5rem;
		padding: 3px;
		border-radius: var(--radius-s);
	}

	.cell.right {
		background: var(--good-soft);
	}

	.cell.wrong {
		background: var(--bad-soft);
	}

	/* The thermometer only looks at the suitable: the other row fades back. */
	.faded {
		opacity: 0.35;
	}
</style>
