<!--
	The whole demo is a single page that walks through the steps of its mode
	(`STEPS_BY_MODE`): the workshop version on `/`, the solo version on `/solo`.
	Every step gets its own history entry (SvelteKit shallow routing), so the
	phone's back button goes to the previous step instead of leaving the demo.
-->
<script lang="ts">
	import { afterNavigate, pushState, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick, untrack } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	import AppHeader from '$lib/components/ui/AppHeader.svelte';
	import AppShell from '$lib/components/ui/AppShell.svelte';
	import { LANGUAGE_CHOICE_ENABLED } from '$lib/config';
	import type { Mode } from '$lib/domain/types';
	import {
		DEFAULT_LOCALE,
		getI18n,
		loadLocale,
		saveLocale,
		START_LOCALE
	} from '$lib/i18n/index.svelte';
	import { eventOutbox } from '$lib/state/eventOutbox';
	import { Journey, setJourney } from '$lib/state/journey.svelte';
	import { chapterProgressOf } from '$lib/state/steps';
	import JourneyStep from '$lib/steps/JourneyStep.svelte';

	let { mode }: { mode: Mode } = $props();

	const i18n = getI18n();
	// The mode is fixed per route, so the journey never needs to follow a change.
	const journey = setJourney(new Journey(untrack(() => mode)));

	let restored = $state(false);
	let routerReady = $state(false);
	/**
	 * Whether participants can switch languages: always in the solo version,
	 * and in the workshop version when enabled, or when the participant came
	 * through the start page, where they already picked one.
	 */
	let languageSwitch = $state(false);

	onMount(() => {
		const resumed = journey.load();
		if (!resumed) journey.track('opened');
		const picked = loadLocale();
		languageSwitch = mode === 'solo' || LANGUAGE_CHOICE_ENABLED || picked !== null;
		i18n.locale = picked ?? (mode === 'solo' ? START_LOCALE : DEFAULT_LOCALE);
		restored = true;
		return eventOutbox()?.start();
	});

	afterNavigate(() => {
		routerReady = true;
	});

	// Persist progress so a refresh (or a phone locking) never loses the participant's place.
	$effect(() => {
		if (!restored) return;
		journey.save();
		// Only a language the participant could pick is kept: without the switch, it is the default.
		if (languageSwitch) saveLocale(i18n.locale);
	});

	// Journey → history: every new step becomes a history entry.
	$effect(() => {
		const step = journey.step;
		if (!restored || !routerReady) return;
		untrack(() => {
			const state = page.state;
			if (state.step === step) return;
			if (state.step === undefined) replaceState('', { step, depth: 0 });
			else pushState('', { step, depth: (state.depth ?? 0) + 1 });
		});
	});

	// History → journey: the browser's back/forward buttons.
	$effect(() => {
		const step = page.state.step;
		if (typeof step !== 'number') return;
		untrack(() => {
			if (step !== journey.step) journey.goTo(step);
		});
	});

	// Start every step at the top, with focus on its heading for screen readers.
	$effect(() => {
		void journey.step;
		if (!restored) return;
		void tick().then(() => {
			window.scrollTo({ top: 0 });
			document.querySelector<HTMLElement>('[data-step-heading]')?.focus({ preventScroll: true });
		});
	});

	function goBack() {
		if ((page.state.depth ?? 0) > 0) history.back();
		else journey.back();
	}

	const duration = $derived(prefersReducedMotion.current ? 0 : 280);
</script>

<AppShell>
	{#if !restored}
		<!-- Prerendered/first paint: a calm placeholder until the saved progress is restored. -->
		<div class="boot" aria-hidden="true"></div>
	{:else}
		<AppHeader
			progress={chapterProgressOf(journey.current)}
			showLanguage={languageSwitch && journey.current.kind !== 'language'}
			onBack={journey.isFirst ? undefined : goBack}
		/>

		{#key journey.step}
			<main class="main" in:fly={{ y: 16, duration }}>
				<JourneyStep step={journey.current} />
			</main>
		{/key}
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
</style>
