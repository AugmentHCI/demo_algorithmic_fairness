<!--
	"Dit is wat anderen vonden": every vote of one round shown as a little shape
	with a face, one row per answer. Each vote takes the shape, size and colour
	of the participant who most likely cast it (the server's best guess, which
	always names someone). All rows share one shape size, the
	largest at which the fullest row still fits its band, so rows stay comparable
	however many votes come in; the shapes ease to a new size rather than jump.
	Polls the (CDN-cached) API while the screen is open.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchVoteSummary } from '$lib/api/client';
	import type { VoteSummary } from '$lib/api/contracts';
	import { RESULTS_POLL_INTERVAL_MS, RESULTS_POLL_MAX_DURATION_MS } from '$lib/config';
	import { findColour } from '$lib/data/colours';
	import { VOTE_CHOICES, type RuleId, type VoteChoice } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { fitGlyphSize } from '$lib/utils/fitGlyphs';
	import { poll } from '$lib/utils/poll';
	import ShapeGlyph, { type Face } from './ShapeGlyph.svelte';

	let { rule }: { rule: RuleId } = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	/** The mood of every answer, from sad (very unfair) to happy (very fair). */
	const CHOICE_FACES: Readonly<Record<VoteChoice, Face>> = {
		very_unfair: 'sad',
		unfair: 'neutral',
		fair: 'smile',
		very_fair: 'happy'
	};

	// Every row's shapes wrap within a band of this height (one line at full size).
	const BAND_HEIGHT_PX = 42;
	const GLYPH_GAP_PX = 2;
	const GLYPH_MAX_PX = 28;
	const GLYPH_MIN_PX = 8;
	// Shapes pop in one after another, but the last ones not too long after the first.
	const POP_STAGGER_MS = 40;
	const POP_MAX_DELAY_MS = 800;

	let summary = $state<VoteSummary | null>(null);
	let status = $state<'loading' | 'ready' | 'error'>('loading');

	const total = $derived(summary?.total ?? 0);
	const rows = $derived(
		VOTE_CHOICES.map((choice) => {
			const count = summary?.counts[choice] ?? 0;
			const voters = (summary?.voters[choice] ?? []).map((voter) => ({
				shape: voter.shape,
				size: voter.size,
				fill: findColour(voter.colour)?.hex
			}));
			return { choice, count, voters, extra: Math.max(0, count - voters.length) };
		})
	);

	// Each row's band, measured; all are equally wide, the narrowest is used to be safe.
	const bandWidths = $state<number[]>([]);
	const glyphPx = $derived(
		fitGlyphSize(Math.max(0, ...rows.map((row) => row.voters.length)), {
			width: Math.min(...rows.map((_, i) => bandWidths[i] ?? 0)),
			height: BAND_HEIGHT_PX,
			gap: GLYPH_GAP_PX,
			maxPx: GLYPH_MAX_PX,
			minPx: GLYPH_MIN_PX
		})
	);

	onMount(() =>
		poll((signal) => fetchVoteSummary(rule, signal), {
			intervalMs: RESULTS_POLL_INTERVAL_MS,
			maxDurationMs: RESULTS_POLL_MAX_DURATION_MS,
			onResult: (result) => {
				summary = result;
				status = 'ready';
			},
			onError: () => {
				if (!summary) status = 'error';
			}
		})
	);
</script>

<section
	class="votes"
	aria-live="polite"
	aria-busy={status === 'loading'}
	style:--band-height="{BAND_HEIGHT_PX}px"
	style:--glyph-gap="{GLYPH_GAP_PX}px"
	style:--glyph-size="{glyphPx}px"
>
	<ul>
		{#each rows as row, rowIndex (row.choice)}
			<li>
				<span class="label">{t.results.choices[row.choice]}</span>
				<span class="voters" aria-hidden="true" bind:clientWidth={bandWidths[rowIndex]}>
					{#each row.voters as voter, i (i)}
						<span
							class="voter"
							style:animation-delay="{Math.min(i * POP_STAGGER_MS, POP_MAX_DELAY_MS)}ms"
						>
							<ShapeGlyph
								shape={voter.shape}
								size={voter.size}
								fill={voter.fill}
								face={CHOICE_FACES[row.choice]}
								px={glyphPx}
							/>
						</span>
					{/each}
					{#if row.extra > 0}<span class="extra">+{row.extra}</span>{/if}
				</span>
				<span class="visually-hidden">{t.results.count(row.count)}</span>
			</li>
		{/each}
	</ul>

	{#if status === 'error'}
		<p class="note">{t.results.unavailable}</p>
	{:else if status === 'ready' && total === 0}
		<p class="note">{t.results.empty}</p>
	{:else if total > 0}
		<p class="note">{t.results.count(total)}</p>
	{/if}
</section>

<style>
	.votes {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
		overflow: hidden;
	}

	li {
		display: grid;
		grid-template-columns: 6.5rem 1fr;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
	}

	li + li {
		border-top: 1px solid var(--line);
	}

	.label {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		line-height: 1.3;
		color: var(--muted);
	}

	.voters {
		display: flex;
		flex-wrap: wrap;
		align-content: center;
		align-items: center;
		gap: var(--glyph-gap);
		min-height: var(--band-height);
	}

	/* Sized here rather than by the glyph's attributes, so a new size can transition. */
	.voter {
		display: grid;
		width: var(--glyph-size);
		height: var(--glyph-size);
		animation: pop 400ms var(--ease-out) both;
		transition:
			width 500ms var(--ease-out),
			height 500ms var(--ease-out);
	}

	.voter :global(svg) {
		width: 100%;
		height: 100%;
	}

	.extra {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--muted);
	}

	.note {
		font-size: 0.85rem;
		color: var(--muted);
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.4);
		}
	}
</style>
