<script lang="ts">
	import Callout from '$lib/components/Callout.svelte';
	import ScoreFloat from '$lib/components/ScoreFloat.svelte';
	import ScoreModifier from '$lib/components/ScoreModifier.svelte';
	import ShapeGlobe from '$lib/components/illustrations/ShapeGlobe.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { COLOURS, findColour } from '$lib/data/colours';
	import type { ColourId } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	/** Swatches per row at most; the rows are balanced so none looks left over. */
	const MAX_PER_ROW = 6;

	/** Split `items` into the fewest rows of at most `max`, differing in length by one at most. */
	function balancedRows<T>(items: readonly T[], max: number): T[][] {
		const rowCount = Math.ceil(items.length / max);
		const base = Math.floor(items.length / rowCount);
		const longer = items.length % rowCount;
		const rows: T[][] = [];
		let start = 0;
		for (let row = 0; row < rowCount; row++) {
			const length = base + (row < longer ? 1 : 0);
			rows.push(items.slice(start, start + length));
			start += length;
		}
		return rows;
	}

	/**
	 * Swatch order, deliberately unrelated to the (not yet revealed) score modifiers, so
	 * the position of a colour gives no hint of what it does to your score.
	 * Set here rather than in `COLOURS`, whose order also seeds the other
	 * applicants' colours. A colour missing from this list is shown first.
	 */
	const SWATCH_ORDER: readonly ColourId[] = ['green', 'red', 'yellow', 'blue'];

	const swatchRows = balancedRows(
		[...COLOURS].sort((a, b) => SWATCH_ORDER.indexOf(a.id) - SWATCH_ORDER.indexOf(b.id)),
		MAX_PER_ROW
	);

	let selected = $state<ColourId | null>(journey.colourId);
	const selectedColour = $derived(findColour(selected));
	let revealing = $state(false);

	function confirm() {
		if (!selected || revealing) return;
		journey.chooseColour(selected);
		revealing = true;
	}
</script>

{#if journey.persona}
	<Screen title={t.colour.title}>
		<ShapeGlobe
			coloured
			size={160}
			you={{ shape: journey.persona.shape, size: journey.persona.size, fill: selectedColour?.hex }}
		/>

		<p class="muted">{t.colour.body}</p>

		<fieldset disabled={revealing}>
			<legend class="visually-hidden">{t.colour.legend}</legend>
			{#each swatchRows as row, r (r)}
				<div class="row">
					{#each row as colour (colour.id)}
						<label class="swatch" style:--swatch={colour.hex}>
							<input
								type="radio"
								name="colour"
								value={colour.id}
								bind:group={selected}
								class="visually-hidden"
							/>
							<span class="visually-hidden">{t.colours[colour.id]}</span>
							{#if revealing && colour.id === selected}
								<ScoreFloat ondone={() => journey.next()}>
									<ScoreModifier value={colour.scoreModifier} colour={colour.hex} />
								</ScoreFloat>
							{/if}
						</label>
					{/each}
				</div>
			{/each}
		</fieldset>

		<!-- At the stand, the chosen colour goes on the block too, as a sticker. -->
		{#if selected && journey.mode === 'workshop'}
			<div class="sticker">
				<Callout text={t.colour.sticker} />
			</div>
		{/if}

		{#snippet actions()}
			<Button onclick={confirm} disabled={!selected || revealing}>
				{selected ? t.colour.cta : t.colour.ctaDisabled}
			</Button>
		{/snippet}
	</Screen>
{/if}

<style>
	fieldset {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: auto 0 0;
		padding: 0;
		border: 0;
	}

	/* Rows never wrap: on very narrow screens the swatches shrink instead. */
	.row {
		display: flex;
		justify-content: center;
		gap: var(--space-2);
	}

	.swatch {
		position: relative;
		flex: 0 1 2.75rem;
		aspect-ratio: 1;
		border-radius: 10px;
		background: var(--swatch);
		cursor: pointer;
		transition: transform 150ms var(--ease-out);
	}

	.swatch:has(input:checked) {
		transform: scale(1.08);
		box-shadow:
			0 0 0 2px var(--surface),
			0 0 0 4.5px var(--ink);
	}

	fieldset:disabled .swatch {
		cursor: default;
	}

	.swatch:has(input:focus-visible) {
		outline: 3px solid var(--accent-strong);
		outline-offset: 6px;
	}

	.sticker {
		animation: appear 400ms var(--ease-out) both;
	}

	@keyframes appear {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}
</style>
