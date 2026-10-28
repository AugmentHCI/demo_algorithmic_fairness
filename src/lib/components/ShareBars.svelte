<!--
	Per shape, the share of applicants invited: one bar per shape, its outline
	on top. When `changeMs` is set, the bars fill from the share before the change
	to the share after it over that time, alongside the moving avatars.
	The bars' height can be set with `--bar-height`.
-->
<script lang="ts" module>
	import type { Shape } from '$lib/domain/types';

	export interface ShapeTally {
		readonly shape: Shape;
		readonly total: number;
		/** Invited before the change. */
		readonly before: number;
		/** Invited after the change. */
		readonly after: number;
	}
</script>

<script lang="ts">
	import { getI18n } from '$lib/i18n/index.svelte';
	import ShapeGlyph from './ShapeGlyph.svelte';

	interface Props {
		tallies: readonly ShapeTally[];
		/** How long the bars take to show the change; `null` shows the shares before it. */
		changeMs: number | null;
	}

	let { tallies, changeMs }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	const fills: HTMLElement[] = [];

	const share = (count: number, total: number) => (total > 0 ? count / total : 0);
	const fillOf = (fraction: number) => `scaleY(${fraction})`;

	$effect(() => {
		if (!changeMs) return;
		const animations = tallies.map((tally, i) =>
			fills[i]?.animate(
				[
					{ transform: fillOf(share(tally.before, tally.total)) },
					{ transform: fillOf(share(tally.after, tally.total)) }
				],
				{ duration: changeMs, easing: 'ease-in-out', fill: 'backwards' }
			)
		);
		return () => {
			for (const animation of animations) animation?.cancel();
		};
	});
</script>

<div class="shares">
	{#each tallies as tally, i (tally.shape)}
		<div class="share" aria-hidden="true">
			<ShapeGlyph shape={tally.shape} px={16} />
			<span class="bar">
				<span
					class="fill"
					style:transform={fillOf(
						share(changeMs === null ? tally.before : tally.after, tally.total)
					)}
					bind:this={fills[i]}
				></span>
			</span>
		</div>
		{#if tally.total > 0}
			<p class="visually-hidden">
				{t.candidates.tallyChange(t.shapes[tally.shape], tally.before, tally.after, tally.total)}
			</p>
		{/if}
	{/each}
</div>

<style>
	.shares {
		display: flex;
		gap: var(--space-2);
	}

	.share {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
	}

	.bar {
		display: flex;
		overflow: hidden;
		width: 0.875rem;
		height: var(--bar-height, 5.5rem);
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 4px;
	}

	.fill {
		flex: 1;
		background: var(--accent);
		transform-origin: bottom;
	}
</style>
