<!-- Renders the screen for one step of the journey. -->
<script lang="ts">
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Box3D from '$lib/components/illustrations/Box3D.svelte';
	import CvPile from '$lib/components/illustrations/CvPile.svelte';
	import DottedArrow from '$lib/components/illustrations/DottedArrow.svelte';
	import FenceScene from '$lib/components/illustrations/FenceScene.svelte';
	import HistoryBars from '$lib/components/illustrations/HistoryBars.svelte';
	import Ostrich from '$lib/components/illustrations/Ostrich.svelte';
	import PeopleLine from '$lib/components/illustrations/PeopleLine.svelte';
	import ScoreTag from '$lib/components/illustrations/ScoreTag.svelte';
	import Seesaw from '$lib/components/illustrations/Seesaw.svelte';
	import ShapeGlobe from '$lib/components/illustrations/ShapeGlobe.svelte';
	import Thermometer from '$lib/components/Thermometer.svelte';
	import { THERMOMETER_IDS } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';
	import type { Step } from '$lib/state/steps';
	import BlindSpotStep from './BlindSpotStep.svelte';
	import ColourStep from './ColourStep.svelte';
	import EquityStep from './EquityStep.svelte';
	import IdentityStep from './IdentityStep.svelte';
	import IntersectionStep from './IntersectionStep.svelte';
	import LanguageStep from './LanguageStep.svelte';
	import RankingStep from './RankingStep.svelte';
	import ResultsStep from './ResultsStep.svelte';
	import RevealStep from './RevealStep.svelte';
	import BareBoxRuleStep from './rules/BareBoxRuleStep.svelte';
	import CounterfactualRuleStep from './rules/CounterfactualRuleStep.svelte';
	import OpportunityRuleStep from './rules/OpportunityRuleStep.svelte';
	import ParityRuleStep from './rules/ParityRuleStep.svelte';
	import ScoreStep from './ScoreStep.svelte';
	import SoloIdentityStep from './SoloIdentityStep.svelte';
	import StoryStep from './StoryStep.svelte';
	import ThanksStep from './ThanksStep.svelte';
	import TwoWaysStep from './TwoWaysStep.svelte';
	import VoteStep from './VoteStep.svelte';

	let { step }: { step: Step } = $props();

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	const next = () => journey.next();
	const atWorkshop = journey.mode === 'workshop';

	/** At the workshop, a screen's text ends with what to do at the stand; solo leaves that out. */
	function withStand(body: string | readonly string[], stand: string) {
		if (!atWorkshop) return body;
		if (typeof body === 'string') return `${body} ${stand}`;
		return [...body.slice(0, -1), `${body.at(-1)} ${stand}`];
	}

	const RULE_SCREENS = {
		bare_box: BareBoxRuleStep,
		counterfactual: CounterfactualRuleStep,
		parity: ParityRuleStep,
		opportunity: OpportunityRuleStep
	} as const;
</script>

{#if step.kind === 'language'}
	<LanguageStep />
{:else if step.kind === 'world'}
	<StoryStep
		title={t.world.title}
		body={withStand(t.world.body, t.world.stand)}
		mood="surprised"
		cta={t.common.next}
		onNext={next}
	>
		{#snippet illustration()}<ShapeGlobe />{/snippet}
	</StoryStep>
{:else if step.kind === 'identity'}
	{#if atWorkshop}
		<IdentityStep />
	{:else}
		<SoloIdentityStep />
	{/if}
{:else if step.kind === 'colour'}
	<ColourStep />
{:else if step.kind === 'applicants'}
	<StoryStep
		title={t.applicants.title}
		body={t.applicants.body}
		highlight={atWorkshop ? t.applicants.highlight : undefined}
		cta={t.common.next}
		onNext={next}
	>
		{#snippet illustration()}<CvPile label={t.common.yourCv} />{/snippet}
	</StoryStep>
{:else if step.kind === 'algorithm'}
	<StoryStep
		title={t.algorithm.title}
		body={t.algorithm.body}
		cta={t.algorithm.cta}
		mood="curious"
		onNext={next}
	>
		{#snippet illustration()}
			<Box3D />
			<DottedArrow length={40} />
			<ScoreTag value="#" />
		{/snippet}
	</StoryStep>
{:else if step.kind === 'blackBox'}
	<StoryStep
		title={t.blackBox.title}
		body={t.blackBox.body}
		cta={t.blackBox.cta}
		mood="thinking"
		onNext={next}
	>
		{#snippet illustration()}<Box3D width={110} restless />{/snippet}
	</StoryStep>
{:else if step.kind === 'preview'}
	<StoryStep
		title={t.preview.title}
		body={withStand(t.preview.body, t.preview.stand)}
		cta={atWorkshop ? t.preview.cta : t.common.next}
		onNext={next}
	>
		{#snippet illustration()}<PeopleLine />{/snippet}
	</StoryStep>
{:else if step.kind === 'score'}
	<ScoreStep />
{:else if step.kind === 'unaware'}
	<StoryStep
		title={t.unaware.title}
		body={t.unaware.body}
		cta={t.unaware.cta}
		mood="curious"
		onNext={next}
	>
		{#snippet illustration()}
			<EyeOff size={56} color="var(--ink)" strokeWidth={1.75} aria-hidden="true" />
			<DottedArrow length={40} />
			<Box3D />
		{/snippet}
	</StoryStep>
{:else if step.kind === 'headInSand'}
	<StoryStep
		title={t.headInSand.title}
		body={t.headInSand.body}
		highlight={t.headInSand.highlight}
		cta={t.headInSand.cta}
		mood="thinking"
		onNext={next}
	>
		{#snippet illustration()}<Ostrich />{/snippet}
	</StoryStep>
{:else if step.kind === 'thermometers'}
	<StoryStep
		title={t.thermometers.title}
		body={t.thermometers.body}
		cta={t.thermometers.cta}
		mood="curious"
		onNext={next}
	>
		{#snippet illustration()}
			<div class="thermometers">
				{#each THERMOMETER_IDS as thermometer, i (thermometer)}
					<Thermometer {thermometer} level={[0.35, 0.3, 0.5][i]} height={96} />
				{/each}
			</div>
		{/snippet}
	</StoryStep>
{:else if step.kind === 'tradeOff'}
	<StoryStep
		title={t.tradeOff.title}
		body={atWorkshop ? [t.tradeOff.body, t.tradeOff.stand] : t.tradeOff.body}
		cta={t.tradeOff.cta}
		mood="thinking"
		onNext={next}
	>
		{#snippet illustration()}<Seesaw />{/snippet}
	</StoryStep>
{:else if step.kind === 'rule'}
	{@const RuleScreen = RULE_SCREENS[step.rule]}
	<RuleScreen />
{:else if step.kind === 'vote'}
	<VoteStep rule={step.rule} />
{:else if step.kind === 'results'}
	<ResultsStep rule={step.rule} />
{:else if step.kind === 'reveal'}
	<RevealStep />
{:else if step.kind === 'ranking'}
	<RankingStep />
{:else if step.kind === 'intersection'}
	<IntersectionStep />
{:else if step.kind === 'blindSpot'}
	<BlindSpotStep />
{:else if step.kind === 'equity'}
	<EquityStep />
{:else if step.kind === 'history'}
	<StoryStep
		title={t.history.title}
		body={t.history.body}
		highlight={t.history.highlight}
		cta={t.history.cta}
		mood="thinking"
		onNext={next}
	>
		{#snippet illustration()}
			<HistoryBars label={t.history.past} />
			<DottedArrow length={40} />
			<Box3D />
		{/snippet}
	</StoryStep>
{:else if step.kind === 'repair'}
	<StoryStep
		title={t.repair.title}
		body={t.repair.body}
		highlight={t.repair.highlight}
		cta={t.repair.cta}
		mood="curious"
		onNext={next}
	>
		{#snippet illustration()}<FenceScene stage="justice" introFrom="equity" />{/snippet}
	</StoryStep>
{:else if step.kind === 'twoWays'}
	<TwoWaysStep />
{:else if step.kind === 'thanks'}
	<ThanksStep />
{/if}

<style>
	.thermometers {
		display: flex;
		gap: var(--space-6);
	}
</style>
