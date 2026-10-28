<!--
	"De regel deed meer dan meten": the fairness rules did not just measure, they
	gave low-scoring shapes a boost. Participants compare equality (the same crate
	for everyone) with equity (the support each one needs), and get a first look
	at justice (the fence comes down), which the next screens explain.
-->
<script lang="ts">
	import Guide from '$lib/components/Guide.svelte';
	import FenceScene from '$lib/components/illustrations/FenceScene.svelte';
	import RichText from '$lib/components/RichText.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import { FENCE_STAGES, type FenceStage } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	let stage = $state<FenceStage>('equality');

	const options = $derived(
		FENCE_STAGES.map((value) => ({
			value,
			label: t.fence.stages[value],
			hint: t.fence.english?.[value],
			hintLang: 'en'
		}))
	);
</script>

<Screen title={t.equity.title}>
	<Guide mood="thinking" talkKey="equity">
		<p>{t.equity.body}</p>
	</Guide>

	<section class="compare" aria-label={t.equity.legend}>
		<FenceScene {stage} />
		<SegmentedControl legend={t.equity.legend} {options} bind:value={stage} />
		<p class="caption" aria-live="polite"><RichText text={t.equity.captions[stage]} /></p>
	</section>

	{#snippet actions()}
		<AtScreenEnd>
			<Button onclick={() => journey.next()}>{t.equity.cta}</Button>
		</AtScreenEnd>
	{/snippet}
</Screen>

<style>
	.compare {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-4) var(--space-4);
		border: 1px solid var(--line);
		border-radius: var(--radius-l);
		background: var(--card);
	}

	.caption {
		min-height: 4.5em;
	}
</style>
