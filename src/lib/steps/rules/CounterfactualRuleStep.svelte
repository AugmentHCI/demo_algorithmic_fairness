<!--
	Thermometer 1, "je vorm alleen": change one thing about yourself (the photo on
	your CV changes with it), drag the CV into the box again and see whether you
	would now get an interview.
-->
<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { tick } from 'svelte';
	import { backOut, cubicOut } from 'svelte/easing';
	import { prefersReducedMotion, Tween } from 'svelte/motion';
	import { scale } from 'svelte/transition';
	import Callout from '$lib/components/Callout.svelte';
	import CandidateRows from '$lib/components/CandidateRows.svelte';
	import DraggableCv from '$lib/components/DraggableCv.svelte';
	import DragHint from '$lib/components/DragHint.svelte';
	import Box3D from '$lib/components/illustrations/Box3D.svelte';
	import CvSheet from '$lib/components/illustrations/CvSheet.svelte';
	import DottedArrow from '$lib/components/illustrations/DottedArrow.svelte';
	import ScoreTag from '$lib/components/illustrations/ScoreTag.svelte';
	import ShapeGlyph from '$lib/components/ShapeGlyph.svelte';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { whatIf } from '$lib/domain/scenario';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { CvDrop } from '$lib/state/cvDrop.svelte';
	import {
		getJourney,
		WHAT_IF_ATTRIBUTES,
		whatIfChange,
		type WhatIfAttribute
	} from '$lib/state/journey.svelte';
	import { revealBelow } from '$lib/utils/reveal';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	/** Counting up from your original score to the new one, as on the score screen. */
	const COUNT_MS = 1100;

	/**
	 * The change picked on this screen. `journey.whatIf` only records it once the
	 * changed CV has been through the box, so a refresh never shows an unearned score.
	 */
	let picked = $state<WhatIfAttribute | null>(journey.whatIf);

	const alternatives = $derived(journey.alternatives);

	const result = $derived(
		journey.scenario && alternatives && picked
			? whatIf(journey.scenario, whatIfChange(alternatives, picked))
			: null
	);

	// svelte-ignore state_referenced_locally
	const shownScore = new Tween(result?.score ?? journey.scenario?.you.score ?? 0, {
		duration: COUNT_MS,
		easing: cubicOut
	});

	let options = $state<HTMLElement>();
	let rows = $state<HTMLElement>();

	const drop = new CvDrop({
		done: journey.whatIf !== null,
		canSend: () => picked !== null,
		onScored: () => {
			journey.whatIf = picked;
			if (result) {
				shownScore.set(result.score, { duration: prefersReducedMotion.current ? 0 : COUNT_MS });
			}
			void showRows();
		}
	});
	const scored = $derived(drop.phase === 'done');

	function optionLabel(attribute: WhatIfAttribute): string {
		if (!alternatives) return '';
		switch (attribute) {
			case 'colour':
				return t.counterfactual.makeColour(t.colours[alternatives.colour.id]);
			case 'shape':
				return t.counterfactual.makeShape(alternatives.shape);
			case 'size':
				return t.counterfactual.makeSize(alternatives.size);
		}
	}

	/**
	 * The avatars start moving right after the score: scroll them into view, keeping
	 * the options visible, so the change and its effect can be seen together.
	 */
	async function showRows(): Promise<void> {
		await tick();
		if (!options || !rows) return;
		revealBelow(options, rows, prefersReducedMotion.current ? 'instant' : 'smooth');
	}

	/** Pick a change: the CV comes back out of the box, changed, and waits to be sent. */
	function choose(attribute: WhatIfAttribute): void {
		if (drop.busy || attribute === picked) return;
		picked = attribute;
		journey.whatIf = null;
		drop.reset();
		shownScore.set(journey.scenario?.you.score ?? 0, { duration: 0 });
	}
</script>

{#if journey.scenario && alternatives}
	{@const you = journey.scenario.you}
	{@const changed = result?.pool.find((c) => c.isYou) ?? you}
	<Screen title={t.counterfactual.title}>
		<ThermometerCard thermometer="counterfactual" />

		<p class="muted">{t.counterfactual.pick}</p>

		<div class="workbench" bind:this={drop.area}>
			<div class="try">
				<DraggableCv {drop}>
					<CvSheet
						label={t.common.yourCv}
						shape={changed.shape}
						size={changed.size}
						fill={changed.colour}
						tilt={-6}
						width={84}
					/>
				</DraggableCv>
				<div
					class="options"
					role="radiogroup"
					aria-label={t.counterfactual.title}
					bind:this={options}
				>
					{#each WHAT_IF_ATTRIBUTES as attribute (attribute)}
						<button
							type="button"
							role="radio"
							aria-checked={picked === attribute}
							class="option"
							disabled={drop.busy}
							onclick={() => choose(attribute)}
						>
							{optionLabel(attribute)}
						</button>
					{/each}
				</div>
			</div>

			{#if result}
				<DragHint text={t.counterfactual.dragHint} hidden={!drop.canDrag || drop.dragging} />
				<div class="machine" aria-hidden="true">
					<span class="change">
						<ShapeGlyph shape={you.shape} size={you.size} fill={you.colour} px={32} face="smile" />
						<ArrowRight size={16} color="var(--muted)" />
						{#key picked}
							<span in:scale={{ start: 0.2, duration: 450, easing: backOut }}>
								<ShapeGlyph
									shape={changed.shape}
									size={changed.size}
									fill={changed.colour}
									px={32}
									face="smile"
								/>
							</span>
						{/key}
					</span>
					<DottedArrow length={24} />
					<span class="box" bind:this={drop.box}>
						<Box3D width={60} busy={drop.phase === 'computing'} active={drop.overBox} />
					</span>
					<DottedArrow length={24} />
					<ScoreTag value={scored ? Math.round(shownScore.current) : '?'} pending={!scored} />
				</div>
			{/if}
		</div>

		<p class="visually-hidden" role="status">
			{#if drop.phase === 'computing'}
				{t.score.processing}
			{:else if result && scored}
				{t.counterfactual.newScore(result.score)}
			{/if}
		</p>

		{#if result && scored}
			<div class="verdict" bind:this={rows}>
				<CandidateRows
					pool={result.pool}
					invitedIds={result.invitedIds}
					from={{
						pool: journey.scenario.pool,
						invitedIds: journey.scenario.outcomes.bare_box.invitedIds
					}}
				/>
			</div>
			{#if journey.mode === 'workshop'}
				<Callout text={t.counterfactual.placeBlock(journey.scenario.rank, result.rank)} />
			{/if}
		{/if}

		{#snippet actions()}
			{#if scored}
				<AtScreenEnd>
					<Button onclick={() => journey.next()}>{t.common.next}</Button>
				</AtScreenEnd>
			{:else if result}
				<Button variant="secondary" onclick={() => drop.send()} disabled={!drop.canDrag}>
					{drop.phase === 'computing' ? t.score.processing : t.counterfactual.send}
				</Button>
			{/if}
		{/snippet}
	</Screen>
{/if}

<style>
	.workbench {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
	}

	.try {
		display: flex;
		align-self: stretch;
		align-items: center;
		gap: var(--space-5);
		padding-left: var(--space-2);
	}

	.options {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: var(--space-2);
	}

	.option {
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border: 1.5px solid var(--accent-line);
		border-radius: var(--radius-s);
		background: var(--surface);
		font-size: 1rem;
		cursor: pointer;
		transition:
			background-color 150ms,
			color 150ms,
			opacity 150ms;
	}

	.option[aria-checked='true'] {
		border-color: var(--accent);
		background: var(--accent);
		color: #fff;
	}

	.option:disabled {
		cursor: default;
		opacity: 0.6;
	}

	.machine {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		animation: appear 400ms var(--ease-out) both;
	}

	.change {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}

	.box {
		display: grid;
	}

	.verdict {
		animation: appear 500ms var(--ease-out) both;
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
	}
</style>
