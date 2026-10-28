<!--
	The start page: "by myself" leads to the solo version (`/solo`), "as part of
	a workshop" to the workshop version (`/`). It opens in English, with the
	language switch for Dutch; the language picked here carries over to both.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import User from '@lucide/svelte/icons/user';
	import Users from '@lucide/svelte/icons/users';
	import { onMount, type Component } from 'svelte';
	import Guide from '$lib/components/Guide.svelte';
	import AppHeader from '$lib/components/ui/AppHeader.svelte';
	import AppShell from '$lib/components/ui/AppShell.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import type { Mode } from '$lib/domain/types';
	import { getI18n, loadLocale, saveLocale, START_LOCALE } from '$lib/i18n/index.svelte';

	const i18n = getI18n();
	const t = $derived(i18n.t);

	let mounted = $state(false);

	onMount(() => {
		// Coming back to this page keeps the language picked before.
		i18n.locale = loadLocale() ?? START_LOCALE;
		mounted = true;
	});

	$effect(() => {
		if (mounted) saveLocale(i18n.locale);
	});

	const OPTIONS: readonly { mode: Mode; icon: Component }[] = [
		{ mode: 'solo', icon: User },
		{ mode: 'workshop', icon: Users }
	];
</script>

<AppShell>
	{#if !mounted}
		<!-- Prerendered/first paint: a calm placeholder until the language is known. -->
		<div class="boot" aria-hidden="true"></div>
	{:else}
		<AppHeader progress={null} showLanguage />

		<main class="main">
			<Screen title={t.start.title}>
				<Guide mood="celebrating" talkKey="start">
					<p>{t.start.intro}</p>
				</Guide>

				<ul class="options">
					{#each OPTIONS as { mode, icon: Icon }, index (mode)}
						<li style:animation-delay="{index * 140}ms">
							<a class="option" href={mode === 'solo' ? resolve('/solo') : resolve('/')}>
								<span class="icon" aria-hidden="true"><Icon size={26} strokeWidth={2} /></span>
								<span class="text">
									<strong>{t.start.options[mode].title}</strong>
									<span class="muted">{t.start.options[mode].body}</span>
								</span>
								<ChevronRight class="chevron" size={22} aria-hidden="true" />
							</a>
						</li>
					{/each}
				</ul>
			</Screen>
		</main>
	{/if}
</AppShell>

<style>
	.main {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.boot {
		flex: 1;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.options li {
		animation: rise 500ms var(--ease-out) both;
	}

	.option {
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 2px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		transition:
			transform 120ms var(--ease-out),
			border-color 150ms;
	}

	.option:active {
		transform: scale(0.98);
	}

	@media (hover: hover) {
		.option:hover {
			border-color: var(--accent);
		}
	}

	.icon {
		display: grid;
		flex: none;
		place-items: center;
		width: 3rem;
		height: 3rem;
		border-radius: var(--radius-s);
		background: var(--accent-soft);
		color: var(--accent-strong);
	}

	.text {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.1rem;
		line-height: 1.35;
	}

	.text strong {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	.option :global(.chevron) {
		flex: none;
		color: var(--muted);
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}
</style>
