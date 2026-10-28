<!--
	What everyone chose on the ranking screen: per thermometer a bar of all
	participants, with those who placed it first in its colour and those who
	placed it second in a lighter shade of it. The thermometer placed first most
	often is on top. Polls the (CDN-cached) API while the screen is open; the
	participant's own ranking counts at once, even before it is stored.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fetchRankingSummary } from '$lib/api/client';
	import type { RankingSummary } from '$lib/api/contracts';
	import { RESULTS_POLL_INTERVAL_MS, RESULTS_POLL_MAX_DURATION_MS } from '$lib/config';
	import { THERMOMETER_COLOURS } from '$lib/data/thermometers';
	import type { RankedItem } from '$lib/domain/pairwise';
	import { addRanking } from '$lib/domain/rankingSummary';
	import type { ThermometerId } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { poll } from '$lib/utils/poll';
	import Thermometer from './Thermometer.svelte';

	interface Props {
		/** The participant's own ranking. */
		ranking: readonly RankedItem<ThermometerId>[];
		/** Whether the own ranking was stored already, so the server counts it. */
		stored: boolean;
	}

	let { ranking, stored }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	let fetched = $state<RankingSummary | null>(null);
	let status = $state<'loading' | 'ready' | 'error'>('loading');

	const summary = $derived(fetched && (stored ? fetched : addRanking(fetched, ranking)));
	const percentOf = (count: number) =>
		summary && summary.total > 0 ? (100 * count) / summary.total : 0;

	onMount(() =>
		poll(fetchRankingSummary, {
			intervalMs: RESULTS_POLL_INTERVAL_MS,
			maxDurationMs: RESULTS_POLL_MAX_DURATION_MS,
			onResult: (result) => {
				fetched = result;
				status = 'ready';
			},
			onError: () => {
				if (!fetched) status = 'error';
			}
		})
	);
</script>

<section
	class="others"
	aria-labelledby="ranking-others"
	aria-live="polite"
	aria-busy={status === 'loading'}
>
	<div class="head">
		<h2 id="ranking-others">{t.ranking.others.title}</h2>
		<ul class="legend" aria-hidden="true">
			<li><span class="key first"></span>{t.ranking.others.places.first}</li>
			<li><span class="key second"></span>{t.ranking.others.places.second}</li>
		</ul>
	</div>

	{#if summary && summary.total > 0}
		<ol class="bars">
			{#each summary.tallies as { thermometer, first, second } (thermometer)}
				{@const name = t.thermometer.names[thermometer]}
				<li
					style:--colour={THERMOMETER_COLOURS[thermometer]}
					animate:flip={{ duration: prefersReducedMotion.current ? 0 : 400 }}
				>
					<div class="label" aria-hidden="true">
						<Thermometer {thermometer} height={28} />
						<span class="name">{name}</span>
						<span class="counts">
							<span class="count"><span class="key first"></span>{first}</span>
							<span class="count"><span class="key second"></span>{second}</span>
						</span>
					</div>
					<div class="track" aria-hidden="true">
						<div class="fill">
							<span
								class="segment first"
								class:split={first > 0 && second > 0}
								style:width="{percentOf(first)}%"
							></span>
							<span class="segment second" style:width="{percentOf(second)}%"></span>
						</div>
					</div>
					<p class="visually-hidden">{t.ranking.others.row(name, first, second, summary.total)}</p>
				</li>
			{/each}
		</ol>
		<p class="note">{t.ranking.others.count(summary.total)}</p>
	{:else if status === 'error'}
		<p class="note">{t.ranking.others.unavailable}</p>
	{/if}
</section>

<style>
	.others {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
	}

	.head {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: var(--space-2) var(--space-4);
	}

	h2 {
		font-size: 1.15rem;
	}

	.legend {
		display: flex;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.8rem;
		color: var(--muted);
	}

	.legend li,
	.count {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
	}

	/* The legend speaks for every thermometer, so its keys are neutral; each row
	   repeats them in its own colour. */
	.key {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 3px;
		--key: var(--colour, var(--ink));
	}

	.key.first {
		background: var(--key);
	}

	.key.second {
		background: color-mix(in srgb, var(--key) 40%, var(--surface));
	}

	.bars {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.label {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		margin-bottom: var(--space-1);
	}

	.name {
		flex: 1;
		min-width: 0;
		font-weight: 700;
	}

	.name::first-letter {
		text-transform: uppercase;
	}

	.counts {
		display: flex;
		gap: var(--space-3);
		font-size: 0.85rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		color: var(--muted);
	}

	/* The whole track is every participant; what is left over placed it third. */
	.track {
		height: 0.875rem;
		border-radius: 4px;
		background: color-mix(in srgb, var(--line) 60%, var(--surface));
		overflow: hidden;
	}

	.fill {
		display: flex;
		height: 100%;
		transform-origin: left;
		animation: grow 700ms var(--ease-out) both;
	}

	.segment {
		flex: none;
		height: 100%;
		transition: width 500ms var(--ease-out);
	}

	.segment.first {
		background: var(--colour);
	}

	/* A thin gap in the surface colour keeps the two shades apart. */
	.segment.split {
		border-right: 2px solid var(--card);
	}

	.segment.second {
		background: color-mix(in srgb, var(--colour) 40%, var(--surface));
	}

	.note {
		margin: 0;
		font-size: 0.85rem;
		color: var(--muted);
	}

	@keyframes grow {
		from {
			scale: 0 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.fill {
			animation: none;
		}

		.segment {
			transition: none;
		}
	}
</style>
