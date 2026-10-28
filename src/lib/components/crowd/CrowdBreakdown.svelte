<!--
	A crowd breaks down into its subgroups, one step at a time:

	1. `crowd`:  everyone stands around in random places;
	2. `sorted`: everyone walks to their shape × size cluster, the invited on the left;
	3. `judged`: everyone who was not invited fades;
	4. `shapes`: bars show the share invited per shape;
	5. `split`:  one shape's bar makes room for two of its subgroups, the best and
	             the worst served, which are ringed in orange in the crowd.

	The page sets the step, so it can tell the story alongside at the reader's
	own pace; each change of step plays the move towards it.
-->
<script lang="ts" module>
	import type { SubgroupSplit } from '$lib/domain/intersections';

	export const CROWD_PHASES = ['crowd', 'sorted', 'judged', 'shapes', 'split'] as const;
	export type CrowdPhase = (typeof CROWD_PHASES)[number];

	/** Where the breakdown ends: without a split to show, at the bars per shape. */
	export function lastPhase(split: SubgroupSplit | undefined): CrowdPhase {
		return split ? 'split' : 'shapes';
	}

	/** The steps to go through, in order, for this `split`. */
	export function crowdPhases(split: SubgroupSplit | undefined): readonly CrowdPhase[] {
		return CROWD_PHASES.slice(0, CROWD_PHASES.indexOf(lastPhase(split)) + 1);
	}
</script>

<script lang="ts">
	import ShapeGlyph from '$lib/components/ShapeGlyph.svelte';
	import ReplayButton from '$lib/components/ui/ReplayButton.svelte';
	import YouTag from '$lib/components/YouTag.svelte';
	import type { Crowd } from '$lib/domain/crowd';
	import type { IntersectionTable } from '$lib/domain/intersections';
	import { SHAPES } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { seededRandom } from '$lib/utils/random';
	import { AVATAR, matrixLayout, scatterLayout } from './layout';
	import SplitBars from './SplitBars.svelte';

	interface Props {
		crowd: Crowd;
		/** Who was invited per subgroup, in `crowd`. */
		table: IntersectionTable;
		split?: SubgroupSplit;
		phase: CrowdPhase;
		/** Back to the first step; without it, there is no replay button. */
		onreplay?: () => void;
	}

	let { crowd, table, split, phase, onreplay }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	/** Walking to the clusters: each person sets off at a random moment within the stagger. */
	const SORT_MS = 1600;
	const SORT_STAGGER_MS = 700;
	const FADE_MS = 800;
	/** Room between a cluster and the orange ring around it; less above and below, where the rows are close. */
	const RING_PADDING = { x: AVATAR * 1.1, y: AVATAR * 0.7 };
	/** Any fixed seed will do: it keeps the picture identical on every device and replay. */
	const SEED = 7;

	const matrix = $derived(matrixLayout(crowd.pool, crowd.invitedIds, seededRandom(SEED)));
	const people = $derived.by(() => {
		const random = seededRandom(SEED + 1);
		const scattered = scatterLayout(crowd.pool, matrix.height, random);
		return crowd.pool.map((candidate) => ({
			candidate,
			invited: crowd.invitedIds.has(candidate.id),
			scattered: scattered.get(candidate.id),
			sorted: matrix.spots.get(candidate.id),
			delay: Math.round(random() * SORT_STAGGER_MS)
		}));
	});
	const rings = $derived(
		split && phase === 'split'
			? [split.favoured, split.overlooked].flatMap(({ shape, size }) => {
					const box = matrix.clusters[shape][size];
					if (!box) return [];
					return {
						key: size,
						x: box.left + box.width / 2,
						y: box.top + box.height / 2,
						width: box.width + RING_PADDING.x,
						height: box.height + RING_PADDING.y
					};
				})
			: []
	);

	const reached = (step: CrowdPhase) => CROWD_PHASES.indexOf(phase) >= CROWD_PHASES.indexOf(step);
</script>

<div class="breakdown">
	<div
		class="stage"
		style:aspect-ratio="100 / {matrix.height}"
		style:--avatar={AVATAR}
		style:--sort-ms="{SORT_MS}ms"
		style:--fade-ms="{FADE_MS}ms"
		aria-hidden="true"
	>
		{#each matrix.columns as { size, centre } (size)}
			<span class="label" class:shown={reached('sorted')} style:--x={centre.x} style:--y={centre.y}>
				{t.blindSpot.sizes[size]}
			</span>
		{/each}
		{#each matrix.rows as { shape, centre } (shape)}
			<span class="label" class:shown={reached('sorted')} style:--x={centre.x} style:--y={centre.y}>
				<ShapeGlyph {shape} px={18} />
			</span>
		{/each}

		{#each rings as ring, i (ring.key)}
			<span
				class="ring"
				style:--x={ring.x}
				style:--y={ring.y}
				style:--width={ring.width}
				style:--height={ring.height}
				style:animation-delay="{i * 200}ms"
			></span>
		{/each}

		{#each people as { candidate, invited, scattered, sorted, delay } (candidate.id)}
			{@const spot = reached('sorted') ? sorted : scattered}
			<span
				class="person"
				class:you={candidate.isYou}
				class:faded={reached('judged') && !invited}
				style:--x={spot?.x}
				style:--y={spot?.y}
				style:--delay="{delay}ms"
			>
				<ShapeGlyph
					shape={candidate.shape}
					size={candidate.size}
					fill={candidate.colour}
					face={candidate.isYou ? 'smile' : undefined}
				/>
				{#if candidate.isYou}<YouTag small />{/if}
			</span>
		{/each}
	</div>

	<div class="below">
		<div class="chart">
			{#if reached('shapes')}
				<SplitBars {table} split={phase === 'split' ? split : undefined} />
			{/if}
		</div>
		{#if onreplay}
			<div class="replay"><ReplayButton onclick={onreplay} /></div>
		{/if}
	</div>

	<!-- Hidden through a wrapper: a table never shrinks to the 1px that would hide it, and would widen the page. -->
	<div class="visually-hidden">
		<table>
			<caption>{t.blindSpot.caption}</caption>
			<thead>
				<tr>
					<td></td>
					{#each matrix.columns as { size } (size)}<th scope="col">{t.blindSpot.sizes[size]}</th
						>{/each}
				</tr>
			</thead>
			<tbody>
				{#each SHAPES as shape (shape)}
					<tr>
						<th scope="row">{t.shapes[shape]}</th>
						{#each matrix.columns as { size } (size)}
							{@const { invited, total } = table.cells[shape][size]}
							<td>{t.blindSpot.tally(invited, total)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.breakdown {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	/* Everything on the stage is placed in units of 1% of its width. */
	.stage {
		position: relative;
		container-type: inline-size;
	}

	.label,
	.person,
	.ring {
		position: absolute;
		top: 0;
		left: 0;
		translate: calc(var(--x) * 1cqw - 50%) calc(var(--y) * 1cqw - 50%);
	}

	.label {
		display: flex;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--muted);
		opacity: 0;
		transition: opacity 600ms var(--ease-out);
	}

	.label.shown {
		opacity: 1;
		transition-delay: calc(var(--sort-ms) * 0.6);
	}

	.person {
		display: flex;
		width: calc(var(--avatar) * 1cqw);
		aspect-ratio: 1;
		transition: translate var(--sort-ms) cubic-bezier(0.65, 0, 0.35, 1) var(--delay);
	}

	.person :global(svg) {
		width: 100%;
		height: 100%;
		transition: opacity var(--fade-ms) var(--ease-out);
	}

	/* Only the shape fades: your tag stays easy to find. */
	.person.faded :global(svg) {
		opacity: 0.2;
	}

	.you {
		z-index: 1;
		width: calc(var(--avatar) * 1.3cqw);
	}

	.ring {
		width: calc(var(--width) * 1cqw);
		height: calc(var(--height) * 1cqw);
		border: 2.5px solid var(--accent);
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		animation: ring-in 600ms var(--ease-out) backwards;
	}

	.below {
		position: relative;
		display: flex;
		justify-content: center;
	}

	/* Holds the bars' room from the start, so nothing below jumps when they appear. */
	.chart {
		min-height: 7rem;
	}

	.replay {
		position: absolute;
		right: calc(-1 * var(--space-2));
		bottom: 0;
	}

	@keyframes ring-in {
		from {
			opacity: 0;
			scale: 1.4;
		}
	}
</style>
