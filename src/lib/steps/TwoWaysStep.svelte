<!--
	"Twee manieren vooruit": fair sorting (equity) or repair first (justice).
	There is no right answer, so both options look alike on purpose.
	At the workshop, participants answer on paper: they fill in their card and
	hang it on the side of the board they choose. In the solo version, they tap
	the option they choose.
-->
<script lang="ts">
	import Callout from '$lib/components/Callout.svelte';
	import Guide from '$lib/components/Guide.svelte';
	import StageName from '$lib/components/StageName.svelte';
	import AtScreenEnd from '$lib/components/ui/AtScreenEnd.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { PATH_OPTIONS } from '$lib/data/paths';
	import { PATH_CHOICES, type PathChoice } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);

	const atWorkshop = journey.mode === 'workshop';

	/** Solo version: the way picked, starting from the one chosen before (when coming back). */
	let path = $state<PathChoice | null>(journey.path);

	function choose() {
		if (!path) return;
		void journey.choosePath(path);
		journey.next();
	}
</script>

{#snippet optionContent(path: PathChoice)}
	{@const { icon: Icon, stage } = PATH_OPTIONS[path]}
	<span class="icon" aria-hidden="true"><Icon size={26} strokeWidth={2} /></span>
	<span class="text">
		<span class="stage"><StageName {stage} /></span>
		<strong>{t.twoWays.options[path].title}</strong>
		<span class="muted">{t.twoWays.options[path].body}</span>
	</span>
{/snippet}

<Screen title={t.twoWays.title}>
	{#if atWorkshop}
		<ul class="options">
			{#each PATH_CHOICES as path, index (path)}
				<li class="option" style:animation-delay="{index * 140}ms">
					{@render optionContent(path)}
				</li>
			{/each}
		</ul>
	{:else}
		<fieldset class="options">
			<legend class="visually-hidden">{t.twoWays.title}</legend>
			{#each PATH_CHOICES as option, index (option)}
				<label class="option choosable" style:animation-delay="{index * 140}ms">
					<input
						type="radio"
						name="path"
						value={option}
						bind:group={path}
						class="visually-hidden"
					/>
					{@render optionContent(option)}
				</label>
			{/each}
		</fieldset>
	{/if}

	<Guide mood="thinking" talkKey="twoWays">
		<p>{t.twoWays.body}</p>
	</Guide>

	{#if atWorkshop}
		<Callout text={t.twoWays.card} />
	{/if}

	{#snippet actions()}
		{#if atWorkshop}
			<AtScreenEnd>
				<Button onclick={() => journey.next()}>{t.twoWays.cta}</Button>
			</AtScreenEnd>
		{:else}
			<Button onclick={choose} disabled={!path}>{t.common.next}</Button>
		{/if}
	{/snippet}
</Screen>

<style>
	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
		list-style: none;
	}

	.option {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 2px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
		animation: rise 500ms var(--ease-out) both;
	}

	.choosable {
		cursor: pointer;
		transition:
			border-color 150ms,
			background-color 150ms;
	}

	.choosable:has(input:checked) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}

	.choosable:has(input:focus-visible) {
		outline: 3px solid var(--accent-strong);
		outline-offset: 3px;
	}

	.icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-s);
		background: var(--surface);
		border: 2px solid currentColor;
		color: var(--ink);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.stage {
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	strong {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}
</style>
