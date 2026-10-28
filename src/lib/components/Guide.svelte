<!--
	Pim, the little guide: a cheerful traffic cone that blinks, bobs, wobbles and
	"talks" for a moment whenever its message changes. The message itself is
	ordinary text, so screen readers read it as such.

	The speech bubble can always be folded away, so the rest of the screen fits
	on a small phone. Folded, Pim shrinks into a button that brings it back; a
	dot on it tells when Pim has said something new in the meantime.
-->
<script lang="ts" module>
	export type GuideMood = 'happy' | 'curious' | 'surprised' | 'thinking' | 'celebrating';
</script>

<script lang="ts">
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import { tick, untrack, type Snippet } from 'svelte';
	import { getI18n } from '$lib/i18n/index.svelte';

	interface Props {
		mood?: GuideMood;
		/** Changing this key replays the talking animation. */
		talkKey?: unknown;
		/** Speech bubble content; without it Pim just stands there. */
		children?: Snippet;
		/** Pim's size in px. */
		size?: number;
	}

	let { mood = 'happy', talkKey, children, size = 64 }: Props = $props();

	/** Pim's size while the bubble is folded away. */
	const FOLDED_SIZE = 40;

	const i18n = getI18n();
	let talking = $state(false);
	let folded = $state(false);
	/** Whether Pim said something new while folded. */
	let unread = $state(false);
	/** Set once the participant folds or unfolds, so only their toggles animate. */
	let toggled = $state(false);
	let foldButton = $state<HTMLButtonElement>();
	let unfoldButton = $state<HTMLButtonElement>();

	$effect(() => {
		void talkKey;
		void i18n.locale;
		if (!children) return;
		talking = true;
		// A new message while folded: Pim stays out of the way, but flags it.
		if (untrack(() => folded)) unread = true;
		const timer = setTimeout(() => (talking = false), 1600);
		return () => clearTimeout(timer);
	});

	/** Fold or unfold the bubble; keyboard focus moves to the button that takes the toggle's place. */
	async function setFolded(value: boolean): Promise<void> {
		const toggle = value ? foldButton : unfoldButton;
		const hadFocus = toggle !== undefined && document.activeElement === toggle;
		folded = value;
		toggled = true;
		if (!value) unread = false;
		await tick();
		if (hadFocus) (value ? unfoldButton : foldButton)?.focus({ preventScroll: true });
	}

	const MOUTHS: Record<GuideMood, string> = {
		happy: 'M42 70 Q50 79 58 70',
		curious: 'M44 72 Q50 76 56 71',
		surprised: 'M46 72 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0',
		thinking: 'M44 73 L56 71',
		celebrating: 'M40 68 Q50 85 60 68 Z'
	};
</script>

<!-- Inside the unfold button Pim is decorative: the button's label says it all. -->
{#snippet avatar(px: number, decorative = false)}
	<svg
		class={['avatar', mood, { talking }]}
		viewBox="0 0 100 100"
		width={px}
		height={px}
		role={decorative ? undefined : 'img'}
		aria-label={decorative ? undefined : i18n.t.common.guideName}
		aria-hidden={decorative ? 'true' : undefined}
	>
		<g class="body">
			<g class="cone">
				<rect x="10" y="84" width="80" height="10" rx="4" fill="#b8400a" />
				<path
					d="M45 8 Q50 3 55 8 L80 86 L20 86 Z"
					fill="#e8530f"
					stroke="#e8530f"
					stroke-width="4"
					stroke-linejoin="round"
				/>
				<path d="M37.9 24 L62.1 24 L65.3 34 L34.7 34 Z" fill="#fff" />
				<ellipse cx="32" cy="66" rx="5" ry="3.5" fill="#f79b6e" opacity="0.9" />
				<ellipse cx="68" cy="66" rx="5" ry="3.5" fill="#f79b6e" opacity="0.9" />
				<g class="eyes">
					<ellipse cx="41" cy="53" rx="6.5" ry="7.5" fill="#fff" />
					<ellipse cx="59" cy="53" rx="6.5" ry="7.5" fill="#fff" />
					<circle class="pupil" cx="42.5" cy="54" r="3.4" fill="#1d1811" />
					<circle class="pupil" cx="60.5" cy="54" r="3.4" fill="#1d1811" />
				</g>
				<path
					class="mouth"
					d={MOUTHS[mood]}
					fill={mood === 'celebrating' ? '#1d1811' : 'none'}
					stroke="#1d1811"
					stroke-width="3.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</g>
		</g>
	</svg>
{/snippet}

{#if children && folded}
	<button
		bind:this={unfoldButton}
		type="button"
		class="unfold"
		class:toggled
		aria-expanded="false"
		onclick={() => setFolded(false)}
	>
		<span class="folded-avatar">
			{@render avatar(FOLDED_SIZE, true)}
			{#if unread}<span class="dot" aria-hidden="true"></span>{/if}
		</span>
		<span class="unfold-label">
			{i18n.t.common.showGuide}
			{#if unread}<span class="visually-hidden">({i18n.t.common.guideNew})</span>{/if}
		</span>
		<ChevronDown size={18} aria-hidden="true" />
	</button>
{:else}
	<div class="guide" class:toggled>
		{@render avatar(size)}

		{#if children}
			<div class="bubble">
				{@render children()}
				<button
					bind:this={foldButton}
					type="button"
					class="fold"
					aria-label={i18n.t.common.hideGuide}
					title={i18n.t.common.hideGuide}
					aria-expanded="true"
					onclick={() => setFolded(true)}
				>
					<ChevronUp size={16} strokeWidth={2.5} aria-hidden="true" />
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.guide {
		display: flex;
		align-items: flex-end;
		gap: var(--space-3);
	}

	.avatar {
		flex: none;
		overflow: visible;
	}

	.body {
		transform-origin: 50% 90%;
		animation: bob 3.2s ease-in-out infinite;
	}

	.celebrating .body {
		animation: hop 0.9s ease-in-out infinite;
	}

	.eyes {
		transform-origin: 50% 53%;
		animation: blink 4.5s infinite;
	}

	.curious .pupil {
		transform: translate(2px, -2px);
	}

	.thinking .pupil {
		transform: translate(-2px, -3px);
	}

	/* A cone rocks on its base, like one that was just bumped. */
	.cone {
		transform-origin: 50px 94px;
		animation: wobble 2.8s ease-in-out infinite;
	}

	.mouth {
		transform-origin: 50px 72px;
	}

	.talking .mouth {
		animation: talk 0.22s ease-in-out infinite alternate;
	}

	.bubble {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		background: var(--card);
		border: 1px solid var(--line);
		border-radius: var(--radius-m) var(--radius-m) var(--radius-m) 4px;
		color: var(--muted);
		margin-bottom: var(--space-4);
	}

	.bubble::before {
		content: '';
		position: absolute;
		left: -9px;
		bottom: 10px;
		width: 16px;
		height: 16px;
		background: var(--card);
		border-left: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		transform: rotate(45deg);
	}

	/* A badge on the bubble's corner, so it takes no room from the text. */
	.fold {
		position: absolute;
		top: -0.75rem;
		right: -0.5rem;
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--card);
		color: var(--muted);
		box-shadow: 0 1px 3px rgb(0 0 0 / 8%);
		cursor: pointer;
		transition:
			background-color 150ms,
			color 150ms;
	}

	/* A comfortable touch target around the small visible button. */
	.fold::after {
		content: '';
		position: absolute;
		inset: -0.5rem;
	}

	.fold:active {
		background: var(--canvas);
		color: var(--ink);
	}

	.unfold {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		align-self: flex-start;
		min-height: 3rem;
		padding: var(--space-1) var(--space-4) var(--space-1) var(--space-2);
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--card);
		color: var(--muted);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			border-color 150ms,
			color 150ms;
	}

	.unfold:active {
		color: var(--ink);
	}

	@media (hover: hover) {
		.fold:hover {
			background: var(--canvas);
			color: var(--ink);
		}

		.unfold:hover {
			border-color: var(--muted);
			color: var(--ink);
		}
	}

	.folded-avatar {
		position: relative;
		display: flex;
	}

	.dot {
		position: absolute;
		top: 0;
		right: 0;
		width: 0.625rem;
		height: 0.625rem;
		border: 2px solid var(--card);
		border-radius: 50%;
		background: var(--accent);
	}

	.toggled {
		animation: fade-in 200ms var(--ease-out);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-3px);
		}
	}

	@keyframes hop {
		0%,
		100% {
			transform: translateY(0) scale(1, 1);
		}
		40% {
			transform: translateY(-8px) scale(0.96, 1.04);
		}
	}

	@keyframes blink {
		0%,
		92%,
		100% {
			transform: scaleY(1);
		}
		95% {
			transform: scaleY(0.1);
		}
	}

	@keyframes wobble {
		0%,
		100% {
			transform: rotate(-2deg);
		}
		50% {
			transform: rotate(2deg);
		}
	}

	@keyframes talk {
		from {
			transform: scaleY(1);
		}
		to {
			transform: scaleY(0.4);
		}
	}
</style>
