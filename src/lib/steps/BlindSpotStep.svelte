<!--
	"Het hoekje waar niemand keek": under equal share every shape gets its
	proportional places, yet a shape × size subgroup can still be left out.
	The participant's own equal-share outcome, scaled up to a crowd, breaks down
	step by step from everyone, to each shape, to the subgroups of one shape.
	Pim tells the story above it, and the reader moves on to the next step from
	Pim's speech bubble, at their own pace. Only once the whole story has been
	told does the screen offer a way onwards.
-->
<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { tick } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import Callout from '$lib/components/Callout.svelte';
	import CrowdBreakdown, {
		crowdPhases,
		type CrowdPhase
	} from '$lib/components/crowd/CrowdBreakdown.svelte';
	import Guide from '$lib/components/Guide.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { CROWD_FACTOR } from '$lib/config';
	import { DISPLAY_PALETTE } from '$lib/data/colours';
	import { crowdSizeOf } from '$lib/data/personas';
	import { multiplyPool } from '$lib/domain/crowd';
	import { sharpestSplit, tallyIntersections } from '$lib/domain/intersections';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';
	import { seededRandom } from '$lib/utils/random';
	import { revealBelow } from '$lib/utils/reveal';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	/** Any fixed seed will do: it keeps the crowd's colours the same on every device. */
	const CROWD_SEED = 20;

	const crowd = $derived(
		journey.scenario
			? multiplyPool(journey.scenario.pool, journey.scenario.outcomes.parity.invitedIds, {
					factor: CROWD_FACTOR,
					palette: DISPLAY_PALETTE,
					random: seededRandom(CROWD_SEED),
					// No persona is medium-sized, but some of their look-alikes in the crowd are.
					sizeOf: crowdSizeOf
				})
			: undefined
	);
	const table = $derived(crowd ? tallyIntersections(crowd.pool, crowd.invitedIds) : undefined);
	const split = $derived(table ? sharpestSplit(table) : undefined);
	/** Your size, when you belong to one of the two subgroups pointed out. */
	const yourSize = $derived.by(() => {
		const you = journey.scenario?.you;
		const yours = split && [split.favoured, split.overlooked];
		return yours?.find((group) => group.shape === you?.shape && group.size === you.size)?.size;
	});

	const phases = $derived(crowdPhases(split));
	/** Coming back to a story already told, the crowd shows how it ends. */
	let step = $state(journey.blindSpotSeen ? Infinity : 0);
	const lastStep = $derived(phases.length - 1);
	const phase = $derived(phases[Math.min(step, lastStep)] ?? 'crowd');
	const finished = $derived(step >= lastStep);

	let story = $state<HTMLElement>();
	let visual = $state<HTMLElement>();
	let conclusion = $state<HTMLElement>();

	function narration(of: CrowdPhase, applicants: number): string {
		switch (of) {
			case 'crowd':
				return t.blindSpot.crowd(applicants, CROWD_FACTOR);
			case 'sorted':
				return t.blindSpot.sorted;
			case 'judged':
				return t.blindSpot.judged;
			case 'shapes':
				return t.blindSpot.shapes;
			case 'split':
				return split ? t.blindSpot.split(split, yourSize) : t.blindSpot.shapes;
		}
	}

	async function advance(): Promise<void> {
		step = Math.min(step + 1, lastStep);
		if (finished) journey.markBlindSpotSeen();

		// Bring what just changed into view, without pushing Pim's words off the top.
		await tick();
		const changed = conclusion ?? visual;
		if (story && changed) {
			revealBelow(story, changed, prefersReducedMotion.current ? 'instant' : 'smooth');
		}
		// The button that had focus is gone at the end: hand focus to the conclusion.
		conclusion?.focus({ preventScroll: true });
	}

	function replay(): void {
		step = 0;
	}
</script>

{#snippet onwards()}
	<AtScreenEnd>
		<Button onclick={() => journey.next()}>{t.blindSpot.cta}</Button>
	</AtScreenEnd>
{/snippet}

{#if crowd && table}
	{@const applicants = crowd.pool.length}
	<Screen title={t.blindSpot.title} actions={journey.blindSpotSeen ? onwards : undefined}>
		<div bind:this={story}>
			<Guide mood={phase === 'split' ? 'surprised' : 'curious'} talkKey={phase}>
				<!-- Every line takes the same cell, so the bubble is as tall as the longest and never jumps. -->
				<div class="narration">
					<p aria-live="polite">{narration(phase, applicants)}</p>
					{#each phases as other (other)}
						<p class="sizer" aria-hidden="true">{narration(other, applicants)}</p>
					{/each}
				</div>
				{#if !finished}
					<button type="button" class="step" onclick={advance}>
						{t.blindSpot.step}
						<ArrowRight size={18} aria-hidden="true" />
					</button>
				{/if}
			</Guide>
		</div>

		<div class="crowd" bind:this={visual}>
			<CrowdBreakdown {crowd} {table} {split} {phase} onreplay={replay} />

			{#if finished}
				<div class="conclusion" tabindex="-1" bind:this={conclusion}>
					<Callout text={t.blindSpot.highlight} />
				</div>
			{/if}
		</div>
	</Screen>
{/if}

<style>
	.narration {
		display: grid;
	}

	.narration > p {
		grid-area: 1 / 1;
		margin: 0;
	}

	.sizer {
		visibility: hidden;
	}

	.step {
		align-self: flex-end;
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-4);
		border: 0;
		border-radius: 999px;
		/* The darker orange keeps white text at WCAG AA contrast at this size. */
		background: var(--accent-strong);
		color: #fff;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
		touch-action: manipulation;
		transition: transform 120ms var(--ease-out);
	}

	.step:active {
		transform: scale(0.96);
	}

	/* The crowd and its conclusion belong together, so they sit closer than the screen's sections. */
	.crowd {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.conclusion {
		outline: none;
		animation: rise-in 500ms var(--ease-out) both;
	}

	@keyframes rise-in {
		from {
			opacity: 0;
			translate: 0 0.75rem;
		}
	}
</style>
