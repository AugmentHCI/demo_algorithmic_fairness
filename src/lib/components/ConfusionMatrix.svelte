<!--
	Thermometer 3 at a glance: the box's choice (interview or not) set against
	who turned out to be suitable. The applicants drop into their cell one by
	one, in ranking order; then the unsuitable row fades back, leaving the
	suitable row in view: this thermometer compares, per shape, how many of the
	suitable were picked and how many were missed. All of it waits until the
	matrix is scrolled into view.

	A real table, so screen readers get every cell's name and head count.
-->
<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { prefersReducedMotion } from 'svelte/motion';
	import { rankPool } from '$lib/domain/candidates';
	import { confusionCellOf, confusionMatrix, isCorrect } from '$lib/domain/confusion';
	import type { Candidate } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { onceInView } from '$lib/utils/inView';
	import RichText from './RichText.svelte';
	import ShapeGlyph from './ShapeGlyph.svelte';
	import YouTag from './YouTag.svelte';

	interface Props {
		pool: readonly Candidate[];
		/** Who the box invited. */
		invitedIds: ReadonlySet<string>;
	}

	let { pool, invitedIds }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t.opportunity.matrix);

	const DROP_MS = 450;
	const DROP_STAGGER_MS = 80;
	/** Time to take in the full matrix before the focus moves to the suitable row. */
	const FOCUS_PAUSE_MS = 900;

	const animated = !prefersReducedMotion.current;
	/** Whether the applicants have started dropping in: only once the matrix is in view. */
	let started = $state(!animated);
	let focused = $state(!animated);

	const matrix = $derived(confusionMatrix(pool, invitedIds));
	/** Each applicant's place in the ranking: the order in which they drop in. */
	const dropOrder = $derived(new Map(rankPool(pool).map((c, index) => [c.id, index])));

	$effect(() => {
		if (focused || !started) return;
		const timer = setTimeout(
			() => (focused = true),
			(pool.length - 1) * DROP_STAGGER_MS + DROP_MS + FOCUS_PAUSE_MS
		);
		return () => clearTimeout(timer);
	});
</script>

<figure
	class="matrix"
	class:animated
	class:started
	class:focused
	style:--drop-ms="{DROP_MS}ms"
	style:--drop-stagger-ms="{DROP_STAGGER_MS}ms"
	{@attach onceInView(() => (started = true))}
>
	<table>
		<caption class="visually-hidden">{t.caption}</caption>
		<thead>
			<tr>
				<td></td>
				<th scope="col">
					<span class="mark in" aria-hidden="true"><Check size={16} strokeWidth={3} /></span>
					{t.invited}
				</th>
				<th scope="col">
					<span class="mark out" aria-hidden="true"><X size={16} strokeWidth={3} /></span>
					{t.notInvited}
				</th>
			</tr>
		</thead>
		<tbody>
			{#each [true, false] as qualified (qualified)}
				<tr class={qualified ? 'qualified' : 'unqualified'}>
					<th scope="row">{qualified ? t.qualified : t.notQualified}</th>
					{#each [true, false] as invited (invited)}
						{@const cell = confusionCellOf(qualified, invited)}
						{@const members = matrix[cell]}
						<td class={['cell', isCorrect(cell) ? 'right' : 'wrong']}>
							<span class="label">
								{t.cells[cell]}<span class="visually-hidden">: {t.count(members.length)}</span>
							</span>
							<span class="glyphs" aria-hidden="true">
								{#each members as candidate (candidate.id)}
									<span
										class="glyph"
										class:you={candidate.isYou}
										style:--order={dropOrder.get(candidate.id)}
									>
										<ShapeGlyph
											shape={candidate.shape}
											size={candidate.size}
											fill={candidate.colour}
											face={candidate.isYou ? 'smile' : undefined}
											px={candidate.isYou ? 24 : 18}
										/>
										{#if candidate.isYou}<YouTag />{/if}
									</span>
								{/each}
							</span>
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<figcaption><RichText text={t.focus} /></figcaption>
</figure>

<style>
	.matrix {
		margin: 0;
	}

	/* The spacing between cells would also indent the table: pull it back to the edges. */
	table {
		width: calc(100% + 12px);
		margin: -6px;
		table-layout: fixed;
		border-collapse: separate;
		border-spacing: 6px;
	}

	th {
		font-size: 0.85rem;
		font-weight: 700;
		line-height: 1.2;
	}

	thead td,
	tbody th {
		width: 4.75rem;
	}

	thead th {
		padding-bottom: var(--space-1);
		text-align: left;
	}

	tbody th {
		text-align: left;
		vertical-align: middle;
	}

	.mark {
		display: inline-flex;
		vertical-align: -3px;
	}

	.mark.in {
		color: var(--good);
	}

	.mark.out {
		color: var(--accent);
	}

	.cell {
		height: 4.5rem;
		padding: var(--space-2);
		border-radius: var(--radius-s);
		vertical-align: top;
	}

	.cell.right {
		background: var(--good-soft);
	}

	.cell.wrong {
		background: var(--bad-soft);
	}

	.label {
		display: block;
		margin-bottom: var(--space-1);
		font-size: 0.8rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.glyphs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 2px;
	}

	.glyph {
		display: flex;
	}

	/* Room below for the tag, so it never covers a glyph on the next line. */
	.glyph.you {
		position: relative;
		z-index: 1;
		margin-bottom: 6px;
	}

	/* Empty cells until the matrix is in view; then the applicants drop in. */
	.animated:not(.started) .glyph {
		opacity: 0;
	}

	.animated.started .glyph {
		animation: drop var(--drop-ms) var(--ease-out) both;
		animation-delay: calc(var(--order, 0) * var(--drop-stagger-ms));
	}

	/* The thermometer only looks at the suitable: the other row fades back. */
	tr {
		transition: opacity 600ms var(--ease-out);
	}

	.focused tr.unqualified {
		opacity: 0.35;
	}

	figcaption {
		margin-top: var(--space-3);
		font-size: 0.95rem;
		transition: opacity 600ms var(--ease-out);
	}

	/* Hidden until the focus moves, but readable by screen readers from the start. */
	.matrix:not(.focused) figcaption {
		opacity: 0;
	}

	@keyframes drop {
		from {
			opacity: 0;
			transform: translateY(-14px) scale(0.6);
		}
	}
</style>
