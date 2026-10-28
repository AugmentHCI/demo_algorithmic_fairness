<!-- The row of dashes that shows progress within a chapter. -->
<script lang="ts">
	interface Props {
		current: number;
		total: number;
		label: string;
	}

	let { current, total, label }: Props = $props();
</script>

<div class="dashes" role="img" aria-label={label}>
	{#each Array.from({ length: total }, (_, i) => i) as index (index)}
		<span class:done={index < current}></span>
	{/each}
</div>

<style>
	.dashes {
		display: flex;
		gap: 5px;
	}

	span {
		width: 1.25rem;
		height: 0.35rem;
		border-radius: 999px;
		background: var(--line);
		transition: background-color 300ms;
	}

	.done {
		background: var(--accent);
	}
</style>
