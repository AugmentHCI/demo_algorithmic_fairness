<!--
	"Welk blokje heb jij?": participants get a physical block at the table and
	tap the same one here. The blocks form a matrix, one row per size and one
	column per shape, labelled along its edges: the buttons show only the block
	itself, and large and small can be compared side by side. The chosen block
	comes to life (it gets a face) and Pim greets it; confirming takes on a
	persona of that block, whose score then pops out of the block, like the
	colour's on the next screen, so the score can be followed as it is built up.
-->
<script lang="ts">
	import Callout from '$lib/components/Callout.svelte';
	import Guide from '$lib/components/Guide.svelte';
	import ScoreTag from '$lib/components/illustrations/ScoreTag.svelte';
	import ScoreFloat from '$lib/components/ScoreFloat.svelte';
	import ShapeGlyph from '$lib/components/ShapeGlyph.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { PERSONAS } from '$lib/data/personas';
	import { blockKey, blocksOf, type Block } from '$lib/domain/blocks';
	import { SHAPES } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	const BLOCKS = blocksOf(PERSONAS);
	/** Matrix axes: sizes largest first (the order of `blocksOf`), shapes in `SHAPES` order. */
	const ROW_SIZES = [...new Set(BLOCKS.map((block) => block.size))];
	const COLUMN_SHAPES = SHAPES.filter((shape) => BLOCKS.some((block) => block.shape === shape));

	// Grid lines are 1-based and the first row and column hold the axis labels.
	const gridRowOf = (block: Block) => ROW_SIZES.indexOf(block.size) + 2;
	const gridColumnOf = (block: Block) => COLUMN_SHAPES.indexOf(block.shape) + 2;

	const personaKey = journey.persona ? blockKey(journey.persona) : null;
	let selectedKey = $state<string | null>(personaKey);
	const selected = $derived(BLOCKS.find((block) => blockKey(block) === selectedKey));

	/** Whether the confirmed block's score is floating up out of it. */
	let revealing = $state(false);
	/**
	 * The block whose score has been told. Picking another block asks to confirm
	 * that one first; coming back to this screen shows the score right away.
	 */
	let revealedKey = $state<string | null>(personaKey);
	const revealed = $derived(selectedKey !== null && selectedKey === revealedKey);

	async function confirm() {
		if (!selected || journey.claimingPersona || revealing) return;
		await journey.chooseBlock(selected);
		revealing = true;
	}

	function finishReveal() {
		revealing = false;
		revealedKey = selectedKey;
	}
</script>

<Screen title={t.identity.title}>
	<Guide mood={selected ? 'happy' : 'curious'} talkKey={selectedKey}>
		{#if selected}
			<p><strong>{t.identity.hello(selected.size, selected.shape)}</strong></p>
			<p>{t.identity.chosen}</p>
		{:else}
			{#each t.identity.guide as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		{/if}
	</Guide>

	<fieldset disabled={journey.claimingPersona || revealing}>
		<legend class="visually-hidden">{t.identity.legend}</legend>
		<!-- The axis labels are visual only: every radio carries its full name. -->
		<div class="matrix" style:--columns={COLUMN_SHAPES.length}>
			{#each COLUMN_SHAPES as shape, index (shape)}
				<span class="axis column-label" aria-hidden="true" style:grid-column={index + 2}>
					{t.shapes[shape]}
				</span>
			{/each}
			{#each ROW_SIZES as size, index (size)}
				<span class="axis row-label" aria-hidden="true" style:grid-row={index + 2}>
					{t.sizes[size]}
				</span>
			{/each}
			{#each BLOCKS as block (blockKey(block))}
				{@const checked = blockKey(block) === selectedKey}
				<label
					class="block"
					style:grid-row={gridRowOf(block)}
					style:grid-column={gridColumnOf(block)}
				>
					<input
						type="radio"
						name="block"
						value={blockKey(block)}
						bind:group={selectedKey}
						class="visually-hidden"
					/>
					<span class="visually-hidden">{t.describePersona(block.size, block.shape)}</span>
					<span class="glyph" class:alive={checked}>
						<ShapeGlyph
							shape={block.shape}
							size={block.size}
							px={64}
							face={checked ? 'smile' : undefined}
							stroke={checked ? 'var(--ink)' : undefined}
						/>
					</span>
					{#if checked && revealing && journey.persona}
						<ScoreFloat ondone={finishReveal}>
							<ScoreTag value={journey.persona.baseScore} size="large" />
						</ScoreFloat>
					{/if}
				</label>
			{/each}
		</div>
	</fieldset>

	{#if revealed && journey.persona}
		<Callout text={t.identity.score(journey.persona.baseScore)} />
	{/if}

	{#snippet actions()}
		{#if revealed}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.common.next}</Button>
			</AtScreenEnd>
		{:else}
			<Button onclick={confirm} disabled={!selected || revealing} loading={journey.claimingPersona}>
				{selected ? t.identity.cta : t.identity.ctaDisabled}
			</Button>
		{/if}
	{/snippet}
</Screen>

<style>
	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	.matrix {
		display: grid;
		grid-template-columns: auto repeat(var(--columns), minmax(0, 1fr));
		gap: var(--space-2);
		align-items: center;
	}

	.axis {
		color: var(--muted);
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.column-label {
		grid-row: 1;
		text-align: center;
		/* Long names may wrap rather than widen their column. */
		overflow-wrap: anywhere;
	}

	.row-label {
		grid-column: 1;
		padding-right: var(--space-1);
	}

	/* Positioned for the score that floats out of it. */
	.block {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		aspect-ratio: 1;
		padding: var(--space-2);
		border: 2px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
		cursor: pointer;
		transition:
			border-color 150ms,
			background-color 150ms,
			transform 120ms var(--ease-out);
	}

	.block:active {
		transform: scale(0.97);
	}

	.block:has(input:checked) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.block:has(input:focus-visible) {
		outline: 3px solid var(--accent-strong);
		outline-offset: 3px;
	}

	fieldset:disabled .block {
		cursor: default;
	}

	/* Up to 64px, but shrinks with its cell on narrow screens. */
	.glyph {
		display: flex;
		width: 100%;
		max-width: 64px;
	}

	.glyph :global(svg) {
		width: 100%;
		height: auto;
	}

	.glyph.alive {
		animation: come-alive 600ms var(--ease-out);
	}

	@keyframes come-alive {
		0% {
			transform: scale(1);
		}
		35% {
			transform: scale(1.15) rotate(-6deg);
		}
		65% {
			transform: scale(0.97) rotate(3deg);
		}
	}
</style>
