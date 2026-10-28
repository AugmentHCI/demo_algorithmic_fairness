<script lang="ts">
	import Guide from '$lib/components/Guide.svelte';
	import type { Locale } from '$lib/domain/types';
	import { getI18n, I18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();

	/** Button order of the design: English first, Dutch (the default) highlighted. */
	const CHOICES: readonly Locale[] = ['en', 'nl'];

	function choose(locale: Locale) {
		i18n.locale = locale;
		journey.next();
	}
</script>

<section class="language" aria-labelledby="step-title">
	<div class="titles">
		<Guide mood="celebrating" />
		<h1 id="step-title" tabindex="-1" data-step-heading lang="nl">
			{I18n.dictionary('nl').language.title}
		</h1>
		<p lang="en">{I18n.dictionary('en').language.title}</p>
	</div>

	<div class="choices">
		{#each CHOICES as locale (locale)}
			<button
				type="button"
				class={['choice', locale === 'nl' && 'primary']}
				lang={locale}
				onclick={() => choose(locale)}
			>
				{I18n.dictionary(locale).language.choose}
			</button>
		{/each}
	</div>
</section>

<style>
	.language {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--space-6);
		padding: var(--space-6) var(--space-5) calc(var(--space-5) + env(safe-area-inset-bottom));
	}

	.titles {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.titles p {
		color: var(--muted);
	}

	.choices {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
	}

	.choice {
		min-height: 3.5rem;
		border: 2px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--surface);
		color: var(--muted);
		font-weight: 700;
		font-size: 1.1875rem;
		cursor: pointer;
		transition: transform 120ms var(--ease-out);
	}

	.choice.primary {
		border-color: var(--ink);
		background: var(--ink);
		color: #fff;
	}

	.choice:active {
		transform: scale(0.97);
	}
</style>
