<!--
	Who gets an interview: invited applicants above the orange line (the cone),
	the others below. Optionally grouped per shape, as on the thermometer screens.

	Given a `from` layout (the bare box, without any thermometer), it first shows
	that and, once the rows are scrolled into view and have been there a moment,
	steps towards the given layout, through the `via` layouts if any. Each step
	lets the applicants who drop out fade away and, after a short pause, moves
	everyone else to their place in the next layout, so you can see what the
	thermometer changed. A replay button next to the rows plays it all again.
	When grouped per shape, thin lines set the shapes apart, and bars next to the
	rows show each shape's share of invitations, filling from the old share to
	the new one during the last step.

	Your own avatar is bigger and tagged, so you can follow it through every move.
	The orange line stays put throughout: the invited row is as tall as it gets
	in any of the layouts, and its avatars rest on the line.

	Given `enterFrom` instead (where each avatar stood on screen just before this
	mounted), the avatars fly in from there while the line and marks fade in.
-->
<script lang="ts" module>
	import type { Candidate } from '$lib/domain/types';

	export interface CandidateLayout {
		readonly pool: readonly Candidate[];
		readonly invitedIds: ReadonlySet<string>;
		/** Show one cluster per shape (circles, squares, triangles). */
		readonly groupByShape?: boolean;
	}
</script>

<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import { onMount, tick } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade } from 'svelte/transition';
	import { rankPool } from '$lib/domain/candidates';
	import { SHAPES } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { glideFrom, measure } from '$lib/utils/animate';
	import { onceInView } from '$lib/utils/inView';
	import ReplayButton from './ui/ReplayButton.svelte';
	import ShapeGlyph from './ShapeGlyph.svelte';
	import ShareBars, { type ShapeTally } from './ShareBars.svelte';
	import YouTag from './YouTag.svelte';

	interface Props extends CandidateLayout {
		/** Start from this layout and move the applicants into the given one. */
		from?: CandidateLayout;
		/** Layouts to stop at, in order, between `from` and the given one. */
		via?: readonly CandidateLayout[];
		/** Fly the avatars in from these on-screen boxes (by candidate id) on mount. */
		enterFrom?: ReadonlyMap<string, DOMRect>;
	}

	let { pool, invitedIds, groupByShape = false, from, via = [], enterFrom }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	/** How long the starting layout stays put, once in view, before anything moves. */
	const HOLD_MS = 2500;
	/** Fade-out of applicants who are not part of the new layout (drives `.leaving`). */
	const LEAVE_MS = 1100;
	/** Time to take in who is gone before the others move. */
	const LEFT_PAUSE_MS = 800;
	const MOVE_MS = 2100;
	const MOVE_STAGGER_MS = 70;
	/** Time to take in a `via` layout, once everyone has arrived, before the next step. */
	const VIA_PAUSE_MS = 1500;
	const EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

	const target: CandidateLayout = $derived({ pool, invitedIds, groupByShape });
	/** Every layout shown, in order: just the target when there is nothing to move from. */
	const layouts: readonly CandidateLayout[] = $derived(from ? [from, ...via, target] : [target]);
	const lastStage = $derived(layouts.length - 1);

	/** Index into `layouts` of the layout on screen. */
	let stage = $state(0);
	/** Whether the applicants missing from the next layout are fading away. */
	let leaving = $state(false);
	/** How long the avatars of the last step take to reach their spots; `null` until they set off. */
	let moveMs = $state<number | null>(null);
	// svelte-ignore state_referenced_locally
	const entering = enterFrom !== undefined && !prefersReducedMotion.current;
	let container = $state<HTMLElement>();
	/** Whether the rows have been on screen: the change only plays once someone can see it. */
	let seen = $state(false);
	/** The avatars' glides so far, so a replay can stop them mid-flight. */
	let moves: Animation[] = [];
	/** How long the share bars take to show the change: the last step's move, once it set off. */
	const changeMs = $derived(stage > 0 && stage === lastStage ? moveMs : null);

	const layout = $derived(layouts[Math.min(stage, lastStage)]!);
	/** The applicants on screen who are not part of the next layout. */
	const leavingIds = $derived.by(() => {
		const next = layouts[stage + 1];
		if (!next) return new Set<string>();
		const staying = new Set(next.pool.map((c) => c.id));
		return new Set(layout.pool.filter((c) => !staying.has(c.id)).map((c) => c.id));
	});

	/** The invited row, then the others, of `shown`; each split per shape if it groups by shape. */
	function rowsOf(shown: CandidateLayout) {
		const ranked = rankPool(shown.pool);
		return [true, false].map((invited) => {
			const members = ranked.filter((c) => shown.invitedIds.has(c.id) === invited);
			return {
				invited,
				members,
				youIncluded: members.some((c) => c.isYou),
				groups: shown.groupByShape
					? SHAPES.map((shape) => members.filter((c) => c.shape === shape))
					: [members]
			};
		});
	}

	const rows = $derived(rowsOf(layout));
	/**
	 * The invited row of every layout, laid out invisibly under the one on screen
	 * so the row keeps the height of the tallest and the line under it never moves.
	 */
	const invitedRowsOfAll = $derived(
		layouts.length > 1
			? layouts.map((shown) => ({
					grouped: !!shown.groupByShape,
					groups: rowsOf(shown)[0]!.groups
				}))
			: []
	);

	const avatarPx = (candidate: Candidate) => (candidate.isYou ? 30 : 24);

	/**
	 * Per shape, how many of the new pool were invited before and after the last
	 * step, the one into the given layout.
	 */
	const tallies: ShapeTally[] = $derived.by(() => {
		const before = layouts.at(-2);
		if (!before || !groupByShape) return [];
		return SHAPES.map((shape) => {
			const members = pool.filter((c) => c.shape === shape);
			return {
				shape,
				total: members.length,
				before: members.filter((c) => before.invitedIds.has(c.id)).length,
				after: members.filter((c) => invitedIds.has(c.id)).length
			};
		});
	});

	$effect(() => {
		if (stage >= lastStage || !seen) return;
		// At a `via` layout, wait for the avatars to set off to know how long they take to arrive.
		if (stage > 0 && !leaving && moveMs === null) return;
		const delay = leaving
			? LEAVE_MS + LEFT_PAUSE_MS
			: stage === 0
				? HOLD_MS
				: (moveMs ?? 0) + VIA_PAUSE_MS;
		const timer = setTimeout(() => {
			if (!leaving && leavingIds.size > 0) leaving = true;
			else void advance();
		}, delay);
		return () => clearTimeout(timer);
	});

	onMount(() => {
		if (entering && enterFrom) glide(enterFrom);
	});

	/** Switch to the next layout, then glide each avatar from its old spot to its new one. */
	async function advance(): Promise<void> {
		const before = measure(avatars());
		moveMs = null;
		stage += 1;
		leaving = false;
		await tick();
		const glides = prefersReducedMotion.current ? [] : glide(before);
		moveMs = glides.length > 0 ? MOVE_MS + (glides.length - 1) * MOVE_STAGGER_MS : 0;
	}

	function glide(before: ReadonlyMap<string, DOMRect>): Animation[] {
		const glides = glideFrom(avatars(), before, {
			duration: MOVE_MS,
			stagger: MOVE_STAGGER_MS,
			easing: EASE_OUT
		});
		moves.push(...glides);
		return glides;
	}

	/** Put everyone back in the starting layout and play the steps again. */
	function replay(): void {
		for (const move of moves) move.cancel();
		moves = [];
		moveMs = null;
		leaving = false;
		stage = 0;
	}

	function avatars(): Map<string, HTMLElement> {
		const elements = container?.querySelectorAll<HTMLElement>('[data-candidate]') ?? [];
		return new Map([...elements].map((el) => [el.dataset.candidate as string, el]));
	}
</script>

<div class="visual" {@attach onceInView(() => (seen = true))}>
	<div class="rows" class:entering bind:this={container} style:--leave-ms="{LEAVE_MS}ms">
		{#if layout.groupByShape}
			<!-- One cell per shape, like the groups: the lines run between the cells. -->
			<div
				class="dividers"
				aria-hidden="true"
				transition:fade={{ duration: prefersReducedMotion.current ? 0 : 400 }}
			>
				{#each SHAPES as shape (shape)}<span></span>{/each}
			</div>
		{/if}
		{#each rows as row (row.invited)}
			<div class={['row', row.invited ? 'in' : 'out']}>
				<span class="mark" aria-hidden="true">
					{#if row.invited}<Check size={26} />{:else}<X size={26} />{/if}
				</span>
				<p class="visually-hidden">
					{row.invited
						? t.candidates.invited(row.members.length, row.youIncluded)
						: t.candidates.notInvited(row.members.length, row.youIncluded)}
				</p>
				<div class="stack" aria-hidden="true">
					<div class="groups" class:grouped={layout.groupByShape}>
						{#each row.groups as group, g (g)}
							<span class="group">
								{#each group as candidate (candidate.id)}
									<span
										class="avatar"
										class:you={candidate.isYou}
										class:pop={candidate.isYou && !from && !entering}
										class:leaving={leaving && leavingIds.has(candidate.id)}
										data-candidate={candidate.id}
									>
										<ShapeGlyph
											shape={candidate.shape}
											size={candidate.size}
											fill={candidate.colour}
											face={candidate.isYou ? 'smile' : undefined}
											px={avatarPx(candidate)}
										/>
										{#if candidate.isYou}<YouTag />{/if}
									</span>
								{/each}
							</span>
						{/each}
					</div>
					{#if row.invited}
						{#each invitedRowsOfAll as ghost, l (l)}
							<div class="groups ghost" class:grouped={ghost.grouped}>
								{#each ghost.groups as group, g (g)}
									<span class="group">
										{#each group as candidate (candidate.id)}
											<span class="placeholder" style:--px="{avatarPx(candidate)}px"></span>
										{/each}
									</span>
								{/each}
							</div>
						{/each}
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if from}
		<div class="aside" class:tucked={tallies.length === 0}>
			{#if tallies.length > 0}
				<ShareBars {tallies} {changeMs} />
			{/if}
			<ReplayButton onclick={replay} />
		</div>
	{/if}
</div>

<style>
	.visual {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.rows {
		--mark-width: 2.25rem;
		--row-gap: var(--space-3);
		position: relative;
		/* Lets the dividers sit behind the rows' content without dropping behind the page. */
		isolation: isolate;
		display: flex;
		flex: 1;
		flex-direction: column;
		min-width: 0;
	}

	/* Spans the avatar columns from the top of the invited row to the bottom of
	   the other, i.e. from the highest avatar to the lowest. */
	.dividers {
		position: absolute;
		inset: var(--row-gap) 0 var(--row-gap) calc(var(--mark-width) + var(--row-gap));
		z-index: -1;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-2);
		pointer-events: none;
	}

	.dividers > span {
		position: relative;
	}

	/* Halfway into the gap to the next shape's cell. */
	.dividers > span:not(:last-child)::after {
		content: '';
		position: absolute;
		inset-block: 0;
		right: calc(var(--space-2) / -2);
		width: 1px;
		background: var(--line);
	}

	.aside {
		display: flex;
		flex: none;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
	}

	/* A lone replay button tucks into the screen's gutter so the rows keep their width. */
	.aside.tucked {
		margin-inline-end: calc(-1 * var(--space-2));
	}

	.row {
		display: grid;
		grid-template-columns: var(--mark-width) 1fr;
		align-items: start;
		gap: var(--row-gap);
		padding-block: var(--row-gap);
	}

	.row.in {
		border-bottom: 2px solid var(--accent);
	}

	.entering .row.in {
		animation: draw-line 600ms 300ms var(--ease-out) both;
	}

	.entering .mark {
		animation: fade-in 500ms 500ms var(--ease-out) both;
	}

	.mark {
		display: grid;
		place-items: center;
		height: 30px;
	}

	.in .mark {
		color: var(--good);
	}

	.out .mark {
		color: var(--accent);
	}

	/* The avatars and the invisible layouts that size the row share one cell. */
	.stack {
		display: grid;
	}

	.stack > * {
		grid-area: 1 / 1;
	}

	.ghost {
		visibility: hidden;
	}

	.placeholder {
		width: var(--px);
		height: var(--px);
	}

	/* The rows leave room under each line of avatars for your tag. */
	.groups {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 2px;
	}

	.groups.grouped {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		align-items: start;
		gap: var(--space-2);
	}

	.group {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 2px;
	}

	/* The invited rest on the line, like under gravity: the bottom line fills
	   first and only the rest wraps above it, with the mark beside the bottom
	   line. (With wrap-reverse, flex-start is the bottom.) */
	.in .mark {
		align-self: end;
	}

	.in .groups:not(.grouped),
	.in .group {
		flex-wrap: wrap-reverse;
		align-content: flex-start;
	}

	/* Per shape, the groups are grid cells: they sink to the line as a whole. */
	.in .groups.grouped {
		align-content: end;
		align-items: end;
	}

	.avatar {
		position: relative;
		display: flex;
		transition:
			opacity var(--leave-ms) var(--ease-out),
			scale var(--leave-ms) var(--ease-out);
	}

	.avatar.leaving {
		opacity: 0;
		scale: 0.5;
	}

	.you {
		z-index: 1;
	}

	.pop {
		animation: pop 600ms var(--ease-out) both;
	}

	@keyframes draw-line {
		from {
			border-bottom-color: transparent;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes pop {
		from {
			transform: scale(0.3);
		}
	}
</style>
