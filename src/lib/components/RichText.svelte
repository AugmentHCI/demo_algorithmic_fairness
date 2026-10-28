<!-- Renders copy where **double asterisks** mark bold text (no HTML injection possible). -->
<script lang="ts">
	let { text }: { text: string } = $props();

	const parts = $derived(
		text.split('**').map((value, index) => ({ value, bold: index % 2 === 1 }))
	);
</script>

{#each parts as part, i (i)}{#if part.bold}<strong>{part.value}</strong
		>{:else}{part.value}{/if}{/each}
