<!--
	The box's verdict, played the first time you see the ranking: all applicants
	stand together and hand their CVs to the box, the box computes, then hands
	each of them a score. Once everyone has theirs, the box fades and `onfinish`
	receives where each avatar stands, so the ranking can fly them to their place.

	Purely visual: the screen underneath says everything this shows.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { cubicOut, linear } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import type { Candidate } from '$lib/domain/types';
	import { animationsDone, measure, offsetBetween } from '$lib/utils/animate';
	import { wait } from '$lib/utils/wait';
	import Box3D, { BOX_SLOT } from './illustrations/Box3D.svelte';
	import CvSheet from './illustrations/CvSheet.svelte';
	import ScoreTag from './illustrations/ScoreTag.svelte';
	import ShapeGlyph from './ShapeGlyph.svelte';

	interface Props {
		pool: readonly Candidate[];
		/** Called once, when the scores are out, with each avatar's on-screen box by candidate id. */
		onfinish: (avatars: ReadonlyMap<string, DOMRect>) => void;
	}

	let { pool, onfinish }: Props = $props();

	/**
	 * - `gathering`: the applicants line up, each holding their CV
	 * - `handing`: the CVs fly into the box
	 * - `computing`: the box shakes
	 * - `scoring`: the scores fly out of the box to their applicants, counting up
	 * - `leaving`: the box and the scores fade, the avatars are about to move
	 */
	type Phase = 'gathering' | 'handing' | 'computing' | 'scoring' | 'leaving';

	/** Durations in ms. A "spread" is the time between the first and the last applicant's turn. */
	const TIMING = {
		gather: 900,
		cvFlight: 700,
		cvSpread: 900,
		compute: 1400,
		scoreFlight: 750,
		scoreSpread: 1200,
		/** Time to take in the scores before the applicants move. */
		read: 1500,
		/** Matches the `.leaving` transitions. */
		leave: 350
	} as const;
	/** How high a CV is lifted on its way to the box. */
	const CV_LIFT_PX = 28;
	const OVERSHOOT = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

	let phase = $state<Phase>('gathering');
	let stage = $state<HTMLElement>();
	let box = $state<HTMLElement>();

	/** Ms since the first score left the box; drives the counting of every tag. */
	const scoreClock = new Tween(0, { easing: linear });

	const columns = $derived(Math.ceil(Math.sqrt(pool.length)));
	const scoreStagger = $derived(staggerOf(TIMING.scoreSpread, pool.length));
	const holdingCvs = $derived(phase === 'gathering' || phase === 'handing');
	const scored = $derived(phase === 'scoring' || phase === 'leaving');

	onMount(() => {
		const run = new AbortController();
		play(run.signal).then(finish, (error: unknown) => {
			if (run.signal.aborted) return;
			// Never leave the participant stuck in front of the box.
			console.error('[box-verdict] Animation failed, skipping to the ranking.', error);
			finish();
		});
		return () => run.abort();
	});

	async function play(signal: AbortSignal): Promise<void> {
		await wait(TIMING.gather, signal);

		phase = 'handing';
		await animationsDone(handInCvs(), signal);

		phase = 'computing';
		await wait(TIMING.compute, signal);

		phase = 'scoring';
		await tick();
		const total = TIMING.scoreSpread + TIMING.scoreFlight;
		void scoreClock.set(total, { duration: total });
		await animationsDone(handOutScores(), signal);
		await wait(TIMING.read, signal);

		phase = 'leaving';
		await wait(TIMING.leave, signal);
	}

	function finish(): void {
		onfinish(measure(elementsBy('avatar')));
	}

	/** Each CV arcs up and drops into the slot of the box, one applicant after the other. */
	function handInCvs(): Animation[] {
		const slot = slotPoint();
		const cvs = [...elementsBy('cv').values()];
		const stagger = staggerOf(TIMING.cvSpread, cvs.length);
		return cvs.map((cv, i) => {
			const { dx, dy } = offsetBetween(cv.getBoundingClientRect(), slot);
			return cv.animate(
				[
					{ transform: 'none', opacity: 1 },
					{
						transform: `translate(${dx * 0.35}px, ${dy * 0.35 - CV_LIFT_PX}px) rotate(-12deg)`,
						opacity: 1,
						offset: 0.45
					},
					{ transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 }
				],
				{ duration: TIMING.cvFlight, delay: i * stagger, easing: 'ease-in-out', fill: 'both' }
			);
		});
	}

	/** Each score pops out of the slot and lands under its applicant, who hops when it arrives. */
	function handOutScores(): Animation[] {
		const slot = slotPoint();
		const avatars = elementsBy('avatar');
		return [...elementsBy('score')].flatMap(([id, tag], i) => {
			const delay = i * scoreStagger;
			const { dx, dy } = offsetBetween(tag.getBoundingClientRect(), slot);
			const flight = tag.animate(
				[
					{ transform: `translate(${dx}px, ${dy}px) scale(0.3)`, opacity: 0 },
					{ opacity: 1, offset: 0.2 },
					{ transform: 'none', opacity: 1 }
				],
				{ duration: TIMING.scoreFlight, delay, easing: OVERSHOOT, fill: 'backwards' }
			);
			const hop = avatars
				.get(id)
				?.animate(
					[
						{ transform: 'none' },
						{ transform: 'translateY(-6px) scale(1.12)' },
						{ transform: 'none' }
					],
					{ duration: 320, delay: delay + TIMING.scoreFlight * 0.6, easing: 'ease-out' }
				);
			return hop ? [flight, hop] : [flight];
		});
	}

	/** The score shown on an applicant's tag right now: it counts up while the tag flies. */
	function shownScore(candidate: Candidate, order: number): number {
		const elapsed = scoreClock.current - order * scoreStagger;
		const progress = Math.min(1, Math.max(0, elapsed / TIMING.scoreFlight));
		return Math.round(candidate.score * cubicOut(progress));
	}

	function slotPoint(): { x: number; y: number } {
		const rect = box?.getBoundingClientRect();
		if (!rect) throw new Error('The box is not on screen');
		return { x: rect.left + rect.width * BOX_SLOT.x, y: rect.top + rect.height * BOX_SLOT.y };
	}

	/** The stage's elements marked `data-{part}`, by candidate id, in pool order. */
	function elementsBy(part: 'avatar' | 'cv' | 'score'): Map<string, HTMLElement> {
		const elements = stage?.querySelectorAll<HTMLElement>(`[data-${part}]`) ?? [];
		return new Map([...elements].map((el) => [el.dataset[part] as string, el]));
	}

	/** Delay between consecutive turns so that `count` turns take `spread` ms in total. */
	function staggerOf(spread: number, count: number): number {
		return count > 1 ? spread / (count - 1) : 0;
	}
</script>

<div class="stage" class:leaving={phase === 'leaving'} bind:this={stage} aria-hidden="true">
	<ul class="group" style:--columns={columns}>
		{#each pool as candidate, i (candidate.id)}
			<li class="applicant" style:--order={i}>
				<span class="avatar" data-avatar={candidate.id}>
					<ShapeGlyph
						shape={candidate.shape}
						size={candidate.size}
						fill={candidate.colour}
						face={candidate.isYou ? 'smile' : undefined}
						px={candidate.isYou ? 40 : 32}
					/>
				</span>

				{#if holdingCvs}
					<span class="cv" data-cv={candidate.id}>
						<CvSheet plain={!candidate.isYou} tilt={8} width={candidate.isYou ? 20 : 16} />
					</span>
				{/if}

				<span class="score">
					{#if scored}
						<span data-score={candidate.id}>
							<ScoreTag
								value={shownScore(candidate, i)}
								size={candidate.isYou ? 'medium' : 'small'}
							/>
						</span>
					{/if}
				</span>
			</li>
		{/each}
	</ul>

	<div class="box" bind:this={box}>
		<Box3D
			width={96}
			busy={phase === 'computing'}
			active={phase === 'handing' || phase === 'scoring'}
		/>
	</div>
</div>

<style>
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-6);
		padding-top: var(--space-2);
	}

	.group {
		display: grid;
		grid-template-columns: repeat(var(--columns), 3rem);
		gap: var(--space-2) var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.applicant {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		animation: gather 450ms var(--ease-out) both;
		animation-delay: calc(var(--order) * 25ms);
	}

	.avatar {
		display: flex;
		align-items: flex-end;
		height: 40px;
	}

	/* Held at the applicant's side, like a sheet of paper under the arm. */
	.cv {
		position: absolute;
		top: 14px;
		right: 0;
	}

	/* Reserves room for the tag, so nothing moves when the scores arrive. */
	.score {
		display: grid;
		place-items: center;
		height: 2rem;
	}

	.score,
	.box {
		transition:
			opacity 350ms var(--ease-out),
			scale 350ms var(--ease-out);
	}

	.leaving .score,
	.leaving .box {
		opacity: 0;
		scale: 0.8;
	}

	@keyframes gather {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.6);
		}
	}
</style>
