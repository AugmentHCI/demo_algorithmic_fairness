<!--
	"Dit is wat anderen vonden": live votes from the tablets, buttons and solo
	phones for one round, and, at the workshop, where to take the block next.
-->
<script lang="ts">
	import Callout from '$lib/components/Callout.svelte';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import VoteResults from '$lib/components/VoteResults.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { RULE_IDS, type RuleId } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	let { rule }: { rule: RuleId } = $props();

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	const cta = $derived.by(() => {
		if (rule === 'bare_box') return t.results.ctaContinue;
		if (rule === RULE_IDS[RULE_IDS.length - 1]) return t.results.ctaLast;
		return t.results.ctaNext;
	});
</script>

<Screen title={t.results.title}>
	{#if rule !== 'bare_box'}
		<ThermometerCard thermometer={rule} />
	{/if}

	<VoteResults {rule} />

	{#if journey.mode === 'workshop'}
		<Callout text={t.results.takeBlock[rule]} />
	{/if}

	{#snippet actions()}
		<AtScreenEnd>
			<Button onclick={() => journey.next()}>{cta}</Button>
		</AtScreenEnd>
	{/snippet}
</Screen>
