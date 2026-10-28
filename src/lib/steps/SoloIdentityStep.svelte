<!--
	"Wie ben jij?", the solo version of "Welk blokje heb jij?": there is no block
	to take at the table, so Pim hands out a persona. Asking for it gives the
	participant a random one, which comes to life (it gets a face) while its
	score pops out of it, as on the workshop's block matrix. Coming back to this
	screen shows the persona and its score right away.
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
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	/** Whether the persona's score is floating up out of it. */
	let revealing = $state(false);
	/** Whether the score has been told: the way onwards appears. */
	let revealed = $state(journey.persona !== undefined);

	function reveal() {
		if (journey.persona) return;
		journey.assignPersona();
		revealing = true;
	}

	function finishReveal() {
		revealing = false;
		revealed = true;
	}
</script>

<Screen title={t.identity.solo.title}>
	<Guide mood={journey.persona ? 'happy' : 'curious'} talkKey={journey.persona?.id}>
		{#if journey.persona}
			<p><strong>{t.identity.hello(journey.persona.size, journey.persona.shape)}</strong></p>
		{:else}
			{#each t.identity.solo.guide as paragraph (paragraph)}
				<p>{paragraph}</p>
			{/each}
		{/if}
	</Guide>

	<!-- Positioned for the score that floats out of it. -->
	<div class="block" class:empty={!journey.persona}>
		{#if journey.persona}
			<span class="glyph">
				<ShapeGlyph
					shape={journey.persona.shape}
					size={journey.persona.size}
					px={96}
					face="smile"
					stroke="var(--ink)"
					label={t.describePersona(journey.persona.size, journey.persona.shape)}
				/>
			</span>
			{#if revealing}
				<ScoreFloat ondone={finishReveal}>
					<ScoreTag value={journey.persona.baseScore} size="large" />
				</ScoreFloat>
			{/if}
		{:else}
			<span class="mystery" aria-hidden="true">?</span>
		{/if}
	</div>

	{#if revealed && journey.persona}
		<Callout text={t.identity.score(journey.persona.baseScore)} />
	{/if}

	{#snippet actions()}
		{#if revealed}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.common.next}</Button>
			</AtScreenEnd>
		{:else}
			<Button onclick={reveal} disabled={revealing}>{t.identity.solo.cta}</Button>
		{/if}
	{/snippet}
</Screen>

<style>
	.block {
		position: relative;
		display: grid;
		place-items: center;
		align-self: center;
		width: 9rem;
		aspect-ratio: 1;
		border: 2px solid var(--accent);
		border-radius: var(--radius-m);
		background: var(--accent-soft);
	}

	.block.empty {
		border-style: dashed;
		border-color: var(--line);
		background: var(--card);
	}

	.mystery {
		font-family: var(--font-display);
		font-size: 3.5rem;
		font-weight: 700;
		color: var(--muted);
		animation: wobble 2.4s ease-in-out infinite;
	}

	.glyph {
		display: flex;
		animation: come-alive 600ms var(--ease-out);
	}

	@keyframes come-alive {
		0% {
			transform: scale(0.6);
		}
		35% {
			transform: scale(1.15) rotate(-6deg);
		}
		65% {
			transform: scale(0.97) rotate(3deg);
		}
	}

	@keyframes wobble {
		0%,
		100% {
			transform: rotate(0);
		}
		50% {
			transform: rotate(-8deg) scale(1.05);
		}
	}
</style>
