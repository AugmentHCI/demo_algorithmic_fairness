<!--
	"Thermometer 1: je vorm alleen." with its question, as in the design.
	Any children are shown below, across the card's full width.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { THERMOMETER_IDS, type ThermometerId } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import Thermometer from './Thermometer.svelte';

	let { thermometer, children }: { thermometer: ThermometerId; children?: Snippet } = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);
	const label = $derived(t.thermometer.label(THERMOMETER_IDS.indexOf(thermometer) + 1));
</script>

<div class="thermometer-card">
	<div class="head">
		<Thermometer {thermometer} height={68} />
		<p>
			<strong class="name">{label}: {t.thermometer.names[thermometer]}.</strong>
			<span class="question">{t.thermometer.questions[thermometer]}</span>
		</p>
	</div>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.thermometer-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--space-4);
	}

	p {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 0.95rem;
		line-height: 1.35;
	}

	.name {
		font-weight: 700;
	}

	.question {
		color: var(--muted);
	}
</style>
