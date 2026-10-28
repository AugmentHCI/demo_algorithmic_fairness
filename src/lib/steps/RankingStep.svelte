<!--
	"Welke thermometer moet altijd groen blijven?": pairwise choices between the
	thermometers, each with a still of how it looked at the stand, turned into a
	personal ranking that is stored anonymously, shown next to what everyone chose.
-->
<script lang="ts">
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';
	import ChapterProgress from '$lib/components/ChapterProgress.svelte';
	import RankingResults from '$lib/components/RankingResults.svelte';
	import Thermometer from '$lib/components/Thermometer.svelte';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import ThermometerSketch from '$lib/components/ThermometerSketch.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney, whatIfChange } from '$lib/state/journey.svelte';
	import { buzz } from '$lib/utils/haptics';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	onMount(() => journey.ensurePairs());

	const answered = $derived(journey.choices.length);
	const total = $derived(journey.pairs.length);
	const done = $derived(total > 0 && answered >= total);
	const currentPair = $derived(journey.pairs[answered]);
	/** The question being shown (all dashes filled once every question is answered). */
	const questionNumber = $derived(Math.min(answered + 1, total));
	const duration = $derived(prefersReducedMotion.current ? 0 : 220);
	/** The change tried at thermometer 1; your shape if none was, as that is what it is about. */
	const whatIf = $derived(
		journey.alternatives ? whatIfChange(journey.alternatives, journey.whatIf ?? 'shape') : null
	);

	function finish() {
		void journey.submitRanking(i18n.locale);
		journey.next();
	}
</script>

<Screen title={t.ranking.title}>
	<div class="intro">
		<p class="muted">{t.ranking.subtitle}</p>
		{#if total > 0}
			<div class="progress">
				<ChapterProgress
					current={questionNumber}
					{total}
					label={t.ranking.counter(questionNumber, total)}
				/>
				<span class="counter" aria-hidden="true">{t.ranking.counter(questionNumber, total)}</span>
			</div>
		{/if}
	</div>

	{#if !done && currentPair}
		{#key answered}
			<div class="pair" in:fly={{ x: 40, duration }}>
				{#each [currentPair.left, currentPair.right] as thermometer, index (thermometer)}
					{#if index === 1}<p class="or" aria-hidden="true">{t.ranking.or}</p>{/if}
					<button
						type="button"
						class="option"
						onclick={() => {
							buzz();
							journey.choose(thermometer);
						}}
					>
						<ThermometerCard {thermometer}>
							{#if journey.scenario && whatIf}
								<ThermometerSketch {thermometer} scenario={journey.scenario} change={whatIf} />
							{/if}
						</ThermometerCard>
					</button>
				{/each}
			</div>
		{/key}
	{:else if done}
		<section class="result" in:fade={{ duration }} aria-labelledby="ranking-result">
			<h2 id="ranking-result">{t.ranking.resultTitle}</h2>
			<ol>
				{#each journey.ranking as { item, position } (item)}
					<li>
						<span class="position">{position}</span>
						<Thermometer thermometer={item} height={40} />
						<span class="name">{t.thermometer.names[item]}</span>
					</li>
				{/each}
			</ol>
		</section>
		<RankingResults ranking={journey.ranking} stored={journey.rankingSubmitted} />
	{/if}

	{#if answered > 0}
		<Button variant="ghost" onclick={() => journey.undoLastChoice()}>
			<Undo2 size={16} aria-hidden="true" />
			{t.ranking.previous}
		</Button>
	{/if}

	{#snippet actions()}
		{#if done}
			<AtScreenEnd>
				<Button onclick={finish} arrow>{t.ranking.cta}</Button>
			</AtScreenEnd>
		{/if}
	{/snippet}
</Screen>

<style>
	.intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.progress {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.counter {
		font-size: 0.85rem;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.pair {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.option {
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		text-align: left;
		cursor: pointer;
		transition: transform 120ms var(--ease-out);
	}

	.option:active {
		transform: scale(0.98);
	}

	/* Hover only where a pointer can hover: on touch screens it sticks to
	   whatever ends up under the finger, i.e. an option of the next question. */
	@media (hover: hover) {
		.option:hover :global(.thermometer-card) {
			border-color: var(--accent);
		}
	}

	.or {
		text-align: center;
		color: var(--muted);
	}

	.result {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
	}

	.result ol {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.result li {
		display: flex;
		align-items: center;
		gap: var(--space-3);
	}

	.position {
		display: grid;
		place-items: center;
		width: 1.8rem;
		height: 1.8rem;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		font-weight: 800;
	}

	.name {
		font-weight: 700;
	}

	.name::first-letter {
		text-transform: uppercase;
	}
</style>
