<!--
	The name of a fence stage (equality, equity, justice), followed by the English
	term when the copy is in another language. Inline: style it from the parent.
-->
<script lang="ts">
	import type { FenceStage } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';

	interface Props {
		stage: FenceStage;
	}

	let { stage }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);
</script>

{t.fence.stages[stage]}
{#if t.fence.english}
	<span lang="en">· {t.fence.english[stage]}</span>
{/if}
