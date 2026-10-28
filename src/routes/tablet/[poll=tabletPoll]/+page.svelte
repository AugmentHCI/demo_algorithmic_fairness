<!--
	A vote tablet for one round: the round's card (its thermometer, or the bare
	algorithm in the first round) and four big blue buttons, from "zeer
	oneerlijk" to "zeer eerlijk". No heading, no faces. Every tap counts at once
	on screen (and with a buzz, where the tablet can) and goes through the outbox
	to /api/votes, where the results screen of that round picks it up.

	Setup: the page asks for the tablet password once (default "fti-demo") and
	remembers it for every tablet page. `/tablet/<poll>#token=<VOTE_INGEST_TOKEN>`
	works too.
-->
<script lang="ts">
	import { dev } from '$app/environment';
	import { afterNavigate, replaceState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { onDestroy, onMount } from 'svelte';
	import { ApiError, checkTabletPassword } from '$lib/api/client';
	import ThermometerCard from '$lib/components/ThermometerCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { TABLET_DOUBLE_PRESS_MS, TABLET_THANKS_MS } from '$lib/config';
	import { VOTE_CHOICES, type VoteChoice } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { rememberTabletToken, takeTabletToken } from '$lib/state/tabletToken';
	import { VoteOutbox } from '$lib/state/voteOutbox.svelte';
	import { buzz } from '$lib/utils/haptics';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const poll = $derived(data.poll);

	const i18n = getI18n();
	const t = $derived(i18n.t);

	let outbox = $state<VoteOutbox | null>(null);
	/** False until the page knows whether this tablet has a key (in the browser only). */
	let checked = $state(false);
	let stopOutbox: (() => void) | undefined;

	/** The latest vote, for the thank-you; `key` restarts the animations on every vote. */
	let lastVote = $state<{ choice: VoteChoice; key: number } | null>(null);
	let votesCast = 0;
	let thanksTimer: ReturnType<typeof setTimeout> | undefined;
	let lastPressAt = Number.NEGATIVE_INFINITY;

	/** Takes the key from the link (if any), and (re)starts the outbox when it is new. */
	function adoptToken() {
		const token = takeTabletToken(location.hash);
		// Remembered now: keep the key out of sight in the address bar.
		if (location.hash) replaceState(resolve('/tablet/[poll=tabletPoll]', { poll }), page.state);
		checked = true;
		if (token) useToken(token);
	}

	/** (Re)starts the outbox with `token`, unless it already uses it. */
	function useToken(token: string) {
		if (token === outbox?.token && outbox.status !== 'unauthorized') return;
		stopOutbox?.();
		outbox = new VoteOutbox(token);
		stopOutbox = outbox.start();
	}

	/** Asked for when the tablet has no key yet, or the server refused the one it has. */
	const needsPassword = $derived(checked && (!outbox || outbox.status === 'unauthorized'));
	let password = $state('');
	let checkingPassword = $state(false);
	let wrongPassword = $state(false);

	async function submitPassword(event: SubmitEvent) {
		event.preventDefault();
		const given = password.trim();
		if (!given || checkingPassword) return;
		checkingPassword = true;
		wrongPassword = false;
		try {
			await checkTabletPassword(given);
		} catch (error) {
			wrongPassword = error instanceof ApiError && error.status === 401;
		} finally {
			checkingPassword = false;
		}
		if (wrongPassword) return;
		// Right, or no wifi to check it: the tablet works either way. Votes wait in the
		// outbox until the server takes them; if it refuses the password, we ask again.
		rememberTabletToken(given);
		password = '';
		useToken(given);
	}

	// The address bar can only be changed once the router has started, i.e. when
	// the first navigation is complete (afterNavigate itself runs just before that).
	afterNavigate(({ complete }) => void complete.then(adoptToken));

	function vote(choice: VoteChoice) {
		// Presses in quick succession are one vote: each press restarts the window,
		// so drumming on the screen counts once too.
		const now = performance.now();
		const repeated = now - lastPressAt < TABLET_DOUBLE_PRESS_MS;
		lastPressAt = now;
		if (repeated || !outbox) return;

		outbox.add({ rule: poll, choice, station: `tablet-${poll}` });
		buzz();
		lastVote = { choice, key: ++votesCast };
		clearTimeout(thanksTimer);
		thanksTimer = setTimeout(() => (lastVote = null), TABLET_THANKS_MS);
	}

	// Keep a copy of the tablet pages, so a reload works without wifi too.
	onMount(() => {
		if (!('serviceWorker' in navigator)) return;
		navigator.serviceWorker
			.register('/service-worker.js', { scope: '/tablet/', type: dev ? 'module' : 'classic' })
			.catch((error) => console.warn('[tablet] No offline copy', error));
	});

	// Keep the screen on while the tablet waits for voters, where the browser allows it.
	onMount(() => {
		let mounted = true;
		let lock: WakeLockSentinel | undefined;
		const keepAwake = async () => {
			if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
			try {
				const sentinel = await navigator.wakeLock.request('screen');
				if (mounted) lock = sentinel;
				else void sentinel.release();
			} catch {
				// Refused (e.g. battery saver): the tablet's own screen settings apply.
			}
		};
		// The browser releases the lock whenever the page is hidden; take it again on return.
		document.addEventListener('visibilitychange', keepAwake);
		void keepAwake();
		return () => {
			mounted = false;
			document.removeEventListener('visibilitychange', keepAwake);
			void lock?.release();
		};
	});

	onDestroy(() => {
		stopOutbox?.();
		clearTimeout(thanksTimer);
	});
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<svelte:window onhashchange={adoptToken} />

<main class="tablet">
	{#if needsPassword}
		<form class="password" onsubmit={submitPassword}>
			<h2>{t.tablet.password.title}</h2>
			{#if outbox?.status === 'unauthorized'}
				<p class="problem" role="alert">{t.tablet.unauthorized}</p>
			{:else}
				<p class="muted">{t.tablet.password.note}</p>
			{/if}
			<label>
				<span>{t.tablet.password.label}</span>
				<input
					type="password"
					bind:value={password}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					required
				/>
			</label>
			{#if wrongPassword}
				<p class="problem" role="alert">{t.tablet.password.wrong}</p>
			{/if}
			<Button type="submit" loading={checkingPassword}>{t.tablet.password.submit}</Button>
		</form>
	{:else}
		<!-- No heading: only what is being voted on, then the four answers. -->
		<div class="round">
			{#if poll === 'bare_box'}
				<p class="bare-box">
					<strong>{t.tablet.bareBox.name}.</strong>
					<span class="muted">{t.tablet.bareBox.question}</span>
				</p>
			{:else}
				<ThermometerCard thermometer={poll} />
			{/if}
		</div>

		<div
			class="choices"
			role="group"
			aria-label={t.tablet.title}
			style:--count={VOTE_CHOICES.length}
		>
			{#each VOTE_CHOICES as choice (choice)}
				<button
					type="button"
					class={['choice', choice, { chosen: lastVote?.choice === choice }]}
					disabled={!outbox}
					onclick={() => vote(choice)}
				>
					<span class="label">{t.results.choices[choice]}</span>
				</button>
			{/each}
		</div>
	{/if}

	<footer>
		<p class="thanks" role="status">
			{#if lastVote}
				{#key lastVote.key}<span class="thanks-text">{t.tablet.thanks}</span>{/key}
			{/if}
		</p>
	</footer>
</main>

<style>
	.tablet {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		min-height: 100dvh;
		padding: max(var(--space-5), env(safe-area-inset-top)) var(--space-5)
			max(var(--space-5), env(safe-area-inset-bottom));
		background: var(--surface);
		/* Blues only on the tablets, also for the password button and its warnings. */
		--accent: #0072b2;
		--accent-strong: #0063a0;
		--accent-soft: #e1eef8;
		--bad-text: #003f66;
		--bad-soft: #e1eef8;
		/* A kiosk: no text selection, callouts or zoom on long or double taps. */
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
		touch-action: manipulation;
	}

	.round {
		width: min(100%, 40rem);
		margin-inline: auto;
	}

	/* The first round has no thermometer yet; its card looks like a thermometer card. */
	.bare-box {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-3) var(--space-4);
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		font-size: 0.95rem;
		line-height: 1.35;
	}

	/* The scale runs left to right in landscape, top to bottom in portrait. */
	.choices {
		flex: 1;
		display: grid;
		grid-template-columns: repeat(var(--count), 1fr);
		gap: var(--space-4);
	}

	.choice {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		min-height: 10rem;
		padding: var(--space-5) var(--space-3);
		border: 3px solid transparent;
		border-radius: var(--radius-l);
		background: var(--choice-bg);
		color: var(--choice-ink);
		cursor: pointer;
		transition: transform 120ms var(--ease-out);
	}

	.choice:active:not(:disabled) {
		transform: scale(0.97);
	}

	.choice:disabled {
		cursor: default;
		opacity: 0.55;
	}

	.choice.chosen {
		border-color: var(--choice-ink);
	}

	/* Shades of blue only, from light (very unfair) to deep (very fair). */
	.very_unfair {
		--choice-bg: #e1eef8;
		--choice-ink: #003f66;
	}

	.unfair {
		--choice-bg: #a9cfec;
		--choice-ink: #003f66;
	}

	.fair {
		--choice-bg: #4f9ad3;
		--choice-ink: #fff;
	}

	.very_fair {
		--choice-bg: #0063a0;
		--choice-ink: #fff;
	}

	.fair.chosen,
	.very_fair.chosen {
		border-color: #003f66;
	}

	.label {
		font-family: var(--font-display);
		font-size: clamp(1.4rem, 3.6vmin, 2.25rem);
		font-weight: 800;
		line-height: 1.1;
		text-align: center;
		text-wrap: balance;
	}

	footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);
		min-height: 3.5rem;
		text-align: center;
	}

	.thanks {
		min-height: 2rem;
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 700;
	}

	.thanks-text {
		display: inline-block;
		animation: rise 300ms var(--ease-out);
	}

	.password {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		width: min(100%, 26rem);
		margin: auto;
		padding: var(--space-5);
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius-l);
		text-align: center;
	}

	.password label {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		width: 100%;
		font-weight: 600;
		text-align: left;
	}

	.password input {
		padding: var(--space-3);
		border: 1px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--surface);
		color: var(--ink);
		font-size: 1.25rem;
		user-select: text;
		-webkit-user-select: text;
	}

	.problem {
		max-width: 40rem;
		padding: var(--space-4);
		border-radius: var(--radius-m);
		background: var(--bad-soft);
		color: var(--bad-text);
		font-size: 0.95rem;
		font-weight: 600;
		text-align: center;
	}

	@media (orientation: portrait) {
		.choices {
			grid-template-columns: 1fr;
			grid-template-rows: repeat(var(--count), 1fr);
		}

		.choice {
			flex-direction: row;
			justify-content: flex-start;
			min-height: 6rem;
			padding-inline: var(--space-6);
		}

		.label {
			text-align: left;
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
	}
</style>
