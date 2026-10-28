<!--
	The share of applicants invited, as bars with their group on top. Without a
	`split`, one bar per shape. Given a `split`, the other shapes' bars fade, the
	split shape's bar moves to the left, and bars for its best- and worst-served
	subgroup rise beside it, each topped with its shape in its size.
-->
<script lang="ts">
	import { cubicInOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { fade } from 'svelte/transition';
	import ShapeGlyph from '$lib/components/ShapeGlyph.svelte';
	import {
		inviteRate,
		type IntersectionTable,
		type SubgroupSplit,
		type Tally
	} from '$lib/domain/intersections';
	import { SHAPES, SIZES, type Shape, type Size } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';

	interface Props {
		table: IntersectionTable;
		/** Zoom in on this shape and two of its subgroups. */
		split?: SubgroupSplit;
	}

	let { table, split }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	/** The other shapes' bars fade, then the split shape's bar moves, then its subgroups rise. */
	const FADE_MS = 350;
	const MOVE_MS = 700;
	const RISE_DELAY_MS = FADE_MS + MOVE_MS - 200;
	const RISE_MS = 900;

	interface Bar {
		readonly key: string;
		readonly shape: Shape;
		/** Set for a subgroup; a shape's bar covers all sizes. */
		readonly size?: Size;
		readonly tally: Tally;
	}

	const bars: Bar[] = $derived(
		split
			? [
					{ key: split.shape, shape: split.shape, tally: table.shapes[split.shape] },
					...[split.favoured, split.overlooked]
						.sort((a, b) => SIZES.indexOf(a.size) - SIZES.indexOf(b.size))
						.map(({ shape, size, tally }) => ({ key: `${shape}-${size}`, shape, size, tally }))
				]
			: SHAPES.map((shape) => ({ key: shape, shape, tally: table.shapes[shape] }))
	);

	const percent = $derived(new Intl.NumberFormat(i18n.locale, { style: 'percent' }));
</script>

<figure class="split-bars">
	<div class="bars">
		{#each bars as bar, i (bar.key)}
			<div
				class="bar"
				class:subgroup={bar.size}
				class:first-subgroup={bar.size && !bars[i - 1]?.size}
				style:--rise-delay="{bar.size ? RISE_DELAY_MS : 0}ms"
				style:--rise-ms="{RISE_MS}ms"
				animate:flip={{ duration: MOVE_MS, delay: FADE_MS, easing: cubicInOut }}
				in:fade={{ duration: RISE_MS / 2, delay: RISE_DELAY_MS }}
				out:fade={{ duration: FADE_MS }}
			>
				<span class="group" aria-hidden="true">
					<span class="glyph"><ShapeGlyph shape={bar.shape} size={bar.size} px={20} /></span>
					<span class="size">{bar.size ? t.blindSpot.sizes[bar.size] : ''}</span>
				</span>
				<span class="track" aria-hidden="true">
					<span class="fill" style:--share={inviteRate(bar.tally) ?? 0}></span>
				</span>
				<span class="percent" aria-hidden="true">{percent.format(inviteRate(bar.tally) ?? 0)}</span>
				<span class="visually-hidden">
					{t.blindSpot.group(bar.shape, bar.size)}: {t.blindSpot.tally(
						bar.tally.invited,
						bar.tally.total
					)}
				</span>
			</div>
		{/each}
	</div>
	<figcaption class="muted" aria-hidden="true">{t.blindSpot.barsLegend}</figcaption>
</figure>

<style>
	.split-bars {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0;
		margin: 0;
	}

	.bars {
		display: flex;
		gap: var(--space-4);
	}

	.bar {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		width: 2.75rem;
	}

	/* A little extra room sets the subgroups apart from the shape they belong to. */
	.first-subgroup {
		margin-inline-start: var(--space-3);
	}

	.group {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.glyph {
		display: grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
	}

	.size {
		/* Kept for the shapes' bars too, so all bars line up. */
		min-height: 0.875rem;
		font-size: 0.6875rem;
		font-weight: 600;
		line-height: 0.875rem;
		color: var(--muted);
	}

	/* Orange like the rings around the subgroups' clusters above, dark enough to read at this size. */
	.subgroup .size {
		color: var(--accent-strong);
	}

	.track {
		display: flex;
		overflow: hidden;
		width: 1.25rem;
		height: 3rem;
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: 4px;
	}

	.fill {
		flex: 1;
		background: var(--accent);
		transform: scaleY(var(--share));
		transform-origin: bottom;
		animation: rise var(--rise-ms) var(--rise-delay) var(--ease-out) backwards;
	}

	.percent {
		font-size: 0.8125rem;
		font-weight: 700;
		line-height: 1.25;
		font-variant-numeric: tabular-nums;
	}

	figcaption {
		font-size: 0.75rem;
		line-height: 1.25;
	}

	@keyframes rise {
		from {
			transform: scaleY(0);
		}
	}
</style>
