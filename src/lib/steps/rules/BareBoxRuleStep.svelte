<!--
	Round 1: the box as bought. Your rank decides; the top slots get an interview.

	The first time, the box plays out its verdict (see BoxVerdict): the applicants
	hand in their CVs and get their scores, then fly to their place in the ranking,
	after which the rest of the screen appears. Hidden parts only fade in: they are
	laid out and readable by screen readers from the start.
-->
<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import BoxVerdict from '$lib/components/BoxVerdict.svelte';
	import CandidateRows from '$lib/components/CandidateRows.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	/**
	 * - `verdict`: the box hands out the scores
	 * - `arriving`: the avatars fly to their place in the ranking
	 * - `done`: everything is shown
	 */
	type Stage = 'verdict' | 'arriving' | 'done';

	/** From the avatars taking off until the rest of the screen starts to appear. */
	const ARRIVE_MS = 1400;

	const playVerdict = !journey.verdictSeen && !prefersReducedMotion.current;

	let stage = $state<Stage>(playVerdict ? 'verdict' : 'done');
	/** Where the avatars stood when the box let go of them. */
	let arrivals = $state<ReadonlyMap<string, DOMRect>>();

	/** Classes for the parts that appear once the avatars have landed. */
	const afterVerdict = $derived({
		pending: stage !== 'done',
		appearing: playVerdict && stage === 'done'
	});

	function arrive(avatars: ReadonlyMap<string, DOMRect>): void {
		arrivals = avatars;
		stage = 'arriving';
	}

	$effect(() => {
		if (stage !== 'arriving') return;
		const timer = setTimeout(conclude, ARRIVE_MS);
		return () => clearTimeout(timer);
	});

	function conclude(): void {
		stage = 'done';
		journey.markVerdictSeen();
	}
</script>

{#if journey.scenario}
	{@const { rank, pool, outcomes } = journey.scenario}
	<Screen>
		{#snippet title()}
			{t.bareBox.title}
			<span class={['rank', afterVerdict]}>{t.bareBox.rank(rank)}</span>
		{/snippet}

		<div class="stack">
			<div class="result">
				<p class={['muted', afterVerdict]} style:--order={1}>
					{t.bareBox.body}
					{#if journey.mode === 'workshop'}{t.bareBox.stand}{/if}
				</p>

				{#if stage !== 'verdict'}
					<CandidateRows {pool} invitedIds={outcomes.bare_box.invitedIds} enterFrom={arrivals} />
				{/if}
				<p class={['muted', afterVerdict]} style:--order={2}>{t.bareBox.qualified}</p>
			</div>

			{#if stage === 'verdict'}
				<div class="verdict">
					<BoxVerdict {pool} onfinish={arrive} />
				</div>
			{/if}
		</div>

		{#snippet actions()}
			<AtScreenEnd>
				<div class={afterVerdict} style:--order={3} inert={stage !== 'done'}>
					<Button onclick={() => journey.next()}>{t.common.next}</Button>
				</div>
			</AtScreenEnd>
		{/snippet}
	</Screen>
{/if}

<style>
	.rank {
		display: block;
	}

	/* The verdict plays on top of the result, which already takes its final place. */
	.stack {
		display: grid;
	}

	.result,
	.verdict {
		grid-area: 1 / 1;
		align-self: start;
	}

	.result {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
	}

	.pending {
		opacity: 0;
	}

	.appearing {
		animation: appear 500ms var(--ease-out) both;
		animation-delay: calc(var(--order, 0) * 150ms);
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
</style>
