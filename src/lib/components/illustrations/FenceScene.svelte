<!--
	Equality, equity and justice, told with shapes: three shapes of different
	heights try to look over a fence. Crates slide in and out between stages, and
	in the last stage the fence itself comes down. A shape smiles once it can see
	over. Decorative: the screens say the same thing in words.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { FENCE_STAGES, type FenceStage, type Shape } from '$lib/domain/types';
	import ShapeGlyph, { glyphGeometry } from '../ShapeGlyph.svelte';

	interface Props {
		stage: FenceStage;
		/** Show this stage first, then move to `stage` shortly after appearing. */
		introFrom?: FenceStage;
	}

	let { stage, introFrom }: Props = $props();

	interface Figure {
		readonly shape: Shape;
		readonly fill: string;
		/** Drawn height in px. */
		readonly height: number;
	}

	// Sizes in px, chosen so that every stage tells its story (a shape sees over
	// the fence when its eyes are above it): with one crate each the smallest
	// still can't see; with crates by need, everyone can.
	const FENCE_HEIGHT = 54;
	const CRATE_HEIGHT = 30;
	const CRATE_WIDTH = 64;
	const HEADROOM = 12;
	const INTRO_DELAY_MS = 900;

	/** Tallest to smallest. */
	const FIGURES: readonly Figure[] = [
		{ shape: 'circle', fill: '#56B4E9', height: 104 },
		{ shape: 'square', fill: '#E6A100', height: 64 },
		{ shape: 'triangle', fill: '#CC79A7', height: 44 }
	];

	/** Crates per figure (in `FIGURES` order) for each stage. */
	const CRATES: Readonly<Record<FenceStage, readonly number[]>> = {
		equality: [1, 1, 1],
		equity: [0, 1, 2],
		justice: [0, 0, 0]
	};

	const cratesOf = (stage: FenceStage, index: number) => CRATES[stage][index] ?? 0;
	const CRATE_SLOTS = Array.from(
		{ length: Math.max(...FENCE_STAGES.flatMap((s) => CRATES[s])) },
		(_, slot) => slot
	);
	const SCENE_HEIGHT =
		Math.max(
			...FENCE_STAGES.flatMap((s) =>
				FIGURES.map((figure, i) => figure.height + cratesOf(s, i) * CRATE_HEIGHT)
			)
		) + HEADROOM;

	let introDone = $state(false);

	onMount(() => {
		if (!introFrom) return;
		const timer = setTimeout(() => (introDone = true), INTRO_DELAY_MS);
		return () => clearTimeout(timer);
	});

	const shown = $derived(introFrom && !introDone ? introFrom : stage);
	const fenceUp = $derived(shown !== 'justice');
	/** Whether the fence was up when it last came to rest. */
	let fenceRestedUp = $state(untrack(() => fenceUp));
	/** Up, or still coming down: only once it is all the way down can everyone see over. */
	const fenceInTheWay = $derived(fenceUp || fenceRestedUp);

	const figures = $derived(
		FIGURES.map((figure, index) => {
			const geometry = glyphGeometry(figure.shape);
			const px = figure.height / (geometry.bottom - geometry.top);
			const crates = cratesOf(shown, index);
			const lift = crates * CRATE_HEIGHT;
			const eyeHeight = (geometry.bottom - geometry.eyes) * px + lift;
			return {
				...figure,
				px,
				crates,
				lift,
				/** Pulls the glyph's empty margin below the ground line. */
				sink: (1 - geometry.bottom) * px,
				width: Math.max(CRATE_WIDTH, figure.height),
				sees: !fenceInTheWay || eyeHeight > FENCE_HEIGHT
			};
		})
	);
</script>

<div
	class="scene"
	style:height="{SCENE_HEIGHT}px"
	style:--fence-height="{FENCE_HEIGHT}px"
	style:--crate-height="{CRATE_HEIGHT}px"
	style:--crate-width="{CRATE_WIDTH}px"
	aria-hidden="true"
>
	<div
		class={['fence', { down: !fenceUp }]}
		ontransitionend={(event) => {
			if (event.target === event.currentTarget) fenceRestedUp = fenceUp;
		}}
	></div>

	{#each figures as figure (figure.shape)}
		<div class="figure" style:width="{figure.width}px">
			{#each CRATE_SLOTS as slot (slot)}
				<span
					class={['crate', { placed: slot < figure.crates }]}
					style:bottom="{slot * CRATE_HEIGHT}px"
					style:transition-delay="{slot * 80}ms"
				></span>
			{/each}
			<span
				class="glyph"
				style:width="{figure.px}px"
				style:bottom="{-figure.sink}px"
				style:--lift="{-figure.lift}px"
			>
				<ShapeGlyph
					shape={figure.shape}
					fill={figure.fill}
					px={figure.px}
					face={figure.sees ? 'happy' : 'sad'}
				/>
			</span>
		</div>
	{/each}
</div>

<style>
	.scene {
		position: relative;
		display: flex;
		align-items: stretch;
		justify-content: center;
		gap: var(--space-4);
		width: min(100%, 20rem);
		margin-inline: auto;
		border-bottom: 3px solid var(--line);
	}

	.fence {
		position: absolute;
		inset: auto 0 0;
		height: var(--fence-height);
		/* Planks with gaps; the two rails behind them show through the gaps. */
		background:
			repeating-linear-gradient(90deg, #e4d8c2 0 16px, transparent 16px 20px),
			linear-gradient(#b9ab92, #b9ab92) 0 20% / 100% 5px no-repeat,
			linear-gradient(#b9ab92, #b9ab92) 0 80% / 100% 5px no-repeat;
		transform-origin: bottom;
		transition: transform 700ms var(--ease-out);
	}

	/* It comes down slowly, so the moment it disappears can sink in. */
	.fence.down {
		transform: scaleY(0);
		transition: transform 2s ease-in-out;
	}

	.figure {
		position: relative;
		flex: none;
	}

	.crate {
		position: absolute;
		left: 50%;
		width: var(--crate-width);
		height: var(--crate-height);
		border: 2px solid #8b5a2b;
		border-radius: 3px;
		background:
			linear-gradient(#8b5a2b, #8b5a2b) center / 100% 2px no-repeat,
			#dca66a;
		opacity: 0;
		translate: -50% -16px;
		transition:
			opacity 300ms,
			translate 400ms var(--ease-out);
	}

	.crate.placed {
		opacity: 1;
		translate: -50% 0;
	}

	.glyph {
		position: absolute;
		left: 50%;
		display: block;
		line-height: 0;
		translate: -50% var(--lift);
		transition: translate 500ms var(--ease-out);
	}
</style>
