<!--
	"Je cv gaat in de doos": drag the CV into the box (or tap "Solliciteer"),
	watch the box compute, then the score is revealed in two beats: first the
	score of the CV without its colour, then, after a pause, the colour's bonus
	or penalty pops up in that colour, as it did when the colour was picked, and
	flows into the score while it moves to the final one. The reveal can be
	replayed.
-->
<script lang="ts">
	import { onDestroy } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import DraggableCv from '$lib/components/DraggableCv.svelte';
	import DragHint from '$lib/components/DragHint.svelte';
	import Guide from '$lib/components/Guide.svelte';
	import Box3D from '$lib/components/illustrations/Box3D.svelte';
	import CvSheet from '$lib/components/illustrations/CvSheet.svelte';
	import DottedArrow from '$lib/components/illustrations/DottedArrow.svelte';
	import ScoreTag from '$lib/components/illustrations/ScoreTag.svelte';
	import ScoreModifier, { formatModifier } from '$lib/components/ScoreModifier.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ReplayButton from '$lib/components/ui/ReplayButton.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { CvDrop } from '$lib/state/cvDrop.svelte';
	import { getJourney } from '$lib/state/journey.svelte';
	import { wait } from '$lib/utils/wait';

	/** Counting up to the colourless score, and the pause after it. */
	const COUNT_MS = 1100;
	const PAUSE_MS = 900;
	/** How long the colour's effect stays beside the score before it flows in. */
	const HOLD_MS = 1300;
	/** The effect flowing into the score, while the score moves to the final one. */
	const MERGE_MS = 1000;

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	const score = $derived(journey.scenario?.you.score ?? 0);
	const baseScore = $derived(journey.persona?.baseScore ?? score);
	/** What the colour did to the score (after rounding and clamping, so it always adds up). */
	const colourEffect = $derived(score - baseScore);
	const colourHex = $derived(journey.colour?.hex ?? 'var(--ink)');

	/**
	 * - `counting`: the score counts up to the score without colour
	 * - `effect`: the colour's effect has popped up beside it
	 * - `merging`: the effect flows into the score, which moves to the final one
	 * - `done`: the final score stands alone
	 */
	type Stage = 'counting' | 'effect' | 'merging' | 'done';
	let stage = $state<Stage>(journey.cvSubmitted ? 'done' : 'counting');
	/** Whether the reveal has played through once, so the participant can read on. */
	let revealed = $state(journey.cvSubmitted);

	// svelte-ignore state_referenced_locally
	const shownScore = new Tween(journey.cvSubmitted ? score : 0, { easing: cubicOut });

	/** Cancels the reveal in progress, if any. */
	let run: AbortController | undefined;
	onDestroy(() => run?.abort());

	async function revealScore() {
		run?.abort();
		const { signal } = (run = new AbortController());
		const duration = (ms: number) => (prefersReducedMotion.current ? 0 : ms);
		/** A tween interrupted by a replay never settles, so each beat also checks for that. */
		const beat = async (done: Promise<void>) => {
			await done;
			signal.throwIfAborted();
		};
		try {
			stage = 'counting';
			await beat(shownScore.set(0, { duration: 0 }));
			await beat(shownScore.set(baseScore, { duration: duration(COUNT_MS) }));
			await wait(PAUSE_MS, signal);
			stage = 'effect';
			await wait(HOLD_MS, signal);
			stage = 'merging';
			await beat(shownScore.set(score, { duration: duration(MERGE_MS) }));
		} catch {
			// Left the screen, or replayed: this run has nothing left to show.
			return;
		}
		stage = 'done';
		revealed = true;
	}

	const drop = new CvDrop({
		done: journey.cvSubmitted,
		onScored: () => {
			journey.submitCv();
			void revealScore();
		}
	});
	const scored = $derived(drop.phase === 'done');
</script>

<Screen title={t.score.title}>
	<div class="stage" class:scored bind:this={drop.area}>
		{#if !scored}
			<DragHint text={t.score.dragHint} hidden={!drop.canDrag || drop.dragging} />
			<div class="cv">
				<DraggableCv {drop}>
					<CvSheet
						label={t.common.yourCv}
						shape={journey.persona?.shape}
						size={journey.persona?.size}
						fill={journey.colour?.hex}
						tilt={-10}
						width={84}
					/>
				</DraggableCv>
			</div>
		{/if}

		<div class="box" bind:this={drop.box}>
			<Box3D width={110} busy={drop.phase === 'computing'} active={drop.overBox} />
		</div>

		{#if scored}
			<div class="result">
				<DottedArrow direction="down" length={36} />
				<div class="readout" aria-hidden="true">
					<ScoreTag value={Math.round(shownScore.current)} size="hero" />
					{#if stage === 'effect' || stage === 'merging'}
						<span
							class="effect"
							class:merging={stage === 'merging'}
							style:--merge-ms="{MERGE_MS}ms"
						>
							<ScoreModifier value={colourEffect} colour={colourHex} />
						</span>
					{/if}
				</div>
				{#if revealed}
					<div class="replay"><ReplayButton onclick={revealScore} /></div>
				{/if}
			</div>
		{/if}
	</div>

	<p class="visually-hidden" role="status">
		{#if drop.phase === 'computing'}
			{t.score.processing}
		{:else if scored && (stage === 'counting' || stage === 'effect')}
			{t.score.baseLabel(baseScore)}
		{:else if scored}
			{t.score.scoreLabel(score, formatModifier(colourEffect))}
		{/if}
	</p>

	{#if revealed}
		<div class="body">
			<Guide mood="curious" talkKey="score">
				{#each t.score.body as paragraph (paragraph)}
					<p>{paragraph}</p>
				{/each}
			</Guide>
		</div>
	{/if}

	{#snippet actions()}
		{#if scored}
			<AtScreenEnd>
				<Button onclick={() => journey.next()} disabled={!revealed}>{t.score.cta}</Button>
			</AtScreenEnd>
		{:else}
			<Button variant="secondary" onclick={() => drop.send()} disabled={!drop.canDrag}>
				{drop.phase === 'computing' ? t.score.processing : t.score.apply}
			</Button>
		{/if}
	{/snippet}
</Screen>

<style>
	.stage {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		min-height: 20rem;
		touch-action: none;
	}

	.stage.scored {
		min-height: 0;
		touch-action: auto;
	}

	.cv {
		align-self: flex-start;
		margin-left: 8%;
	}

	.box {
		margin-top: auto;
	}

	.scored .box {
		margin-top: var(--space-4);
	}

	.result {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		align-self: stretch;
		animation: appear 500ms var(--ease-out) both;
	}

	.readout {
		position: relative;
	}

	/* Pops up at the score's top right corner, then flows into the score's
	   centre while shrinking away. `translate` and `scale` are kept apart so the
	   pop-in and the flow don't overwrite each other's transform. */
	.effect {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 1;
		font-size: 2rem;
		pointer-events: none;
		translate: calc(-50% + 4.25rem) calc(-50% - 2.5rem);
		transition:
			translate var(--merge-ms) ease-in-out,
			scale var(--merge-ms) ease-in-out,
			opacity var(--merge-ms) ease-in-out;
		animation: pop 450ms var(--ease-out);
	}

	.effect.merging {
		translate: -50% -50%;
		scale: 0.4;
		opacity: 0;
	}

	.replay {
		position: absolute;
		right: calc(-1 * var(--space-2));
		bottom: 0;
	}

	.body {
		animation: appear 500ms var(--ease-out) both;
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
	}

	@keyframes pop {
		0% {
			opacity: 0;
			scale: 0.5;
		}
		60% {
			opacity: 1;
			scale: 1.15;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.effect {
			transition: none;
			animation: none;
		}
	}
</style>
