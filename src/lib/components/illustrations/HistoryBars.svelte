<!--
	"Die lage scores komen ergens vandaan": who got hired in the past, per shape.
	Uneven bars, the data the box learned from. Decorative.
-->
<script lang="ts">
	import type { Shape } from '$lib/domain/types';
	import ShapeGlyph from '../ShapeGlyph.svelte';

	let { label }: { label: string } = $props();

	/** Relative bar heights; squares were hired most, circles least (as the box's scores suggest). */
	const BARS: readonly { shape: Shape; level: number }[] = [
		{ shape: 'circle', level: 0.3 },
		{ shape: 'square', level: 1 },
		{ shape: 'triangle', level: 0.55 }
	];
</script>

<figure class="history" aria-hidden="true">
	<div class="bars">
		{#each BARS as bar, index (bar.shape)}
			<div class="column">
				<span class="bar" style:height="{bar.level * 100}%" style:animation-delay="{index * 120}ms"
				></span>
				<ShapeGlyph shape={bar.shape} px={16} />
			</div>
		{/each}
	</div>
	<figcaption>{label}</figcaption>
</figure>

<style>
	.history {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		margin: 0;
	}

	.bars {
		display: flex;
		align-items: flex-end;
		gap: var(--space-2);
		height: 4.5rem;
		padding-bottom: var(--space-1);
		border-bottom: 2px solid var(--line);
	}

	.column {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-1);
		height: 100%;
	}

	.bar {
		width: 1.1rem;
		border-radius: 4px 4px 0 0;
		background: #a79f92;
		transform-origin: bottom;
		animation: grow 700ms var(--ease-out) both;
	}

	figcaption {
		font-size: 0.8rem;
		color: var(--muted);
	}

	@keyframes grow {
		from {
			transform: scaleY(0);
		}
	}
</style>
