<!-- Top bar: back button, the chapter's progress dashes and the language switch. -->
<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Languages from '@lucide/svelte/icons/languages';
	import { getI18n } from '$lib/i18n/index.svelte';
	import type { ChapterProgress as Progress } from '$lib/state/steps';
	import ChapterProgress from '../ChapterProgress.svelte';

	interface Props {
		progress: Progress | null;
		showLanguage: boolean;
		/** Shows the back button; without it there is nothing to go back to. */
		onBack?: () => void;
	}

	let { progress, showLanguage, onBack }: Props = $props();

	const i18n = getI18n();
	const t = $derived(i18n.t);

	function toggleLanguage() {
		i18n.locale = i18n.locale === 'nl' ? 'en' : 'nl';
	}
</script>

<header class="header" data-sticky="top">
	{#if onBack}
		<button class="icon-button" type="button" onclick={onBack} aria-label={t.common.back}>
			<ArrowLeft size={22} aria-hidden="true" />
		</button>
	{:else}
		<span class="spacer" aria-hidden="true"></span>
	{/if}

	<div class="progress">
		{#if progress}
			<ChapterProgress
				current={progress.current}
				total={progress.total}
				label={t.common.progress(progress.current, progress.total)}
			/>
		{/if}
	</div>

	{#if showLanguage}
		<button
			class="language"
			type="button"
			onclick={toggleLanguage}
			aria-label={t.common.switchLanguage}
		>
			<Languages size={16} aria-hidden="true" />
			<span aria-hidden="true">{t.common.switchLanguageShort}</span>
		</button>
	{/if}
</header>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		display: grid;
		grid-template-columns: 2.75rem 1fr auto;
		align-items: center;
		gap: var(--space-2);
		padding: calc(var(--space-2) + env(safe-area-inset-top)) var(--space-3) var(--space-1);
		background: var(--surface);
	}

	.spacer {
		width: 2.75rem;
		height: 2.75rem;
	}

	.icon-button {
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		border: 0;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
	}

	.icon-button:hover {
		background: var(--canvas);
	}

	.language {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		min-height: 2.5rem;
		padding: 0 0.7rem;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--surface);
		font-weight: 700;
		font-size: 0.8rem;
		color: var(--muted);
		cursor: pointer;
	}
</style>
