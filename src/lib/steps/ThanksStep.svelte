<!--
	The end of the demo: Pim celebrates among the shapes, the participant can
	download everything the demo explained as a PDF in the language they did it
	in, the research groups behind it are credited, and workshop participants
	are reminded to hand back their block: their persona goes back in the
	persona box for whoever takes that block next.
-->
<script lang="ts">
	import { asset } from '$app/paths';
	import Download from '@lucide/svelte/icons/download';
	import FileText from '@lucide/svelte/icons/file-text';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { onMount } from 'svelte';
	import Callout from '$lib/components/Callout.svelte';
	import Guide from '$lib/components/Guide.svelte';
	import ShapeGlyph from '$lib/components/ShapeGlyph.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Screen from '$lib/components/ui/Screen.svelte';
	import { INFO_PDF, RESEARCH_GROUPS } from '$lib/data/credits';
	import type { Shape } from '$lib/domain/types';
	import { getI18n } from '$lib/i18n/index.svelte';
	import { getJourney } from '$lib/state/journey.svelte';

	const i18n = getI18n();
	const journey = getJourney();
	const t = $derived(i18n.t);
	const pdf = $derived(INFO_PDF[i18n.locale]);

	onMount(() => {
		journey.track('finished');
		void journey.returnPersona();
	});

	interface Confetti {
		readonly shape: Shape;
		readonly fill: string;
		readonly px: number;
		/** Position in the hero, in % of its width and height. */
		readonly x: number;
		readonly y: number;
		readonly tilt: number;
	}

	const CONFETTI: readonly Confetti[] = [
		{ shape: 'triangle', fill: '#009E73', px: 22, x: 14, y: 22, tilt: -14 },
		{ shape: 'circle', fill: '#0072B2', px: 16, x: 27, y: 70, tilt: 0 },
		{ shape: 'square', fill: '#E6A100', px: 18, x: 8, y: 58, tilt: 12 },
		{ shape: 'circle', fill: '#CC79A7', px: 20, x: 82, y: 20, tilt: 0 },
		{ shape: 'square', fill: '#56B4E9', px: 16, x: 72, y: 68, tilt: -18 },
		{ shape: 'triangle', fill: '#D55E00', px: 20, x: 90, y: 56, tilt: 16 }
	];
</script>

<Screen title={t.thanks.title}>
	<div class="hero" aria-hidden="true">
		{#each CONFETTI as piece, index (index)}
			<span
				class="confetti"
				style:left="{piece.x}%"
				style:top="{piece.y}%"
				style:rotate="{piece.tilt}deg"
				style:animation-delay="{index * -0.45}s"
			>
				<ShapeGlyph shape={piece.shape} fill={piece.fill} px={piece.px} />
			</span>
		{/each}
		<Guide mood="celebrating" size={96} />
	</div>

	<p class="intro">{t.thanks.intro}</p>

	<a
		class="download"
		href={asset(pdf.path)}
		download={pdf.fileName}
		onclick={() => journey.track('pdf_download')}
	>
		<span class="icon" aria-hidden="true"><FileText size={26} strokeWidth={2} /></span>
		<span class="text">
			<strong>{t.thanks.download.title}</strong>
			<span class="muted">{t.thanks.download.detail}</span>
			<span class="cta">
				<Download size={18} strokeWidth={2.25} aria-hidden="true" />
				{t.thanks.download.cta}
			</span>
		</span>
	</a>

	{#if journey.mode === 'workshop'}
		<Callout text={t.thanks.returnBlock} />
	{/if}

	<section class="credits" aria-labelledby="credits-title">
		<h2 id="credits-title">{t.thanks.credits}</h2>
		<ul>
			{#each RESEARCH_GROUPS as group (group.name)}
				<li>
					{#if group.logo}
						<img class="logo" src={asset(group.logo)} alt={group.name} />
					{:else}
						<strong>{group.name}</strong>
					{/if}
					<span class="muted">{group.affiliation}</span>
				</li>
			{/each}
		</ul>
	</section>

	{#snippet actions()}
		<Button variant="ghost" onclick={() => journey.reset()}>
			<RotateCcw size={16} aria-hidden="true" />
			{t.thanks.restart}
		</Button>
	{/snippet}
</Screen>

<style>
	.hero {
		position: relative;
		display: grid;
		place-items: center;
		height: 9.5rem;
		border-radius: var(--radius-l);
		background: radial-gradient(circle at 50% 60%, var(--accent-soft), var(--canvas) 70%);
		overflow: hidden;
	}

	.confetti {
		position: absolute;
		translate: -50% -50%;
		animation: float 3.6s ease-in-out infinite;
	}

	.intro {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 600;
		line-height: 1.35;
	}

	.download {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-4);
		border: 2px solid var(--line);
		border-radius: var(--radius-m);
		background: var(--card);
		color: var(--ink);
		text-decoration: none;
		animation: rise 500ms var(--ease-out) both;
		transition:
			transform 120ms var(--ease-out),
			border-color 150ms;
	}

	.download:active {
		transform: scale(0.98);
	}

	@media (hover: hover) {
		.download:hover {
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
		flex-direction: column;
		gap: 0.1rem;
		line-height: 1.35;
	}

	.text strong {
		font-family: var(--font-display);
		font-size: 1.15rem;
	}

	.cta {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		margin-top: var(--space-2);
		font-weight: 700;
		color: var(--accent-strong);
	}

	.credits {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding-top: var(--space-4);
		border-top: 1px solid var(--line);
	}

	.credits h2 {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--muted);
	}

	.credits ul {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-3);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.credits li {
		display: flex;
		flex-direction: column;
		line-height: 1.3;
	}

	.credits strong {
		font-family: var(--font-display);
		font-weight: 700;
		color: var(--ink);
	}

	.credits .logo {
		align-self: flex-start;
		height: 1.6rem;
		width: auto;
	}

	.credits .muted {
		font-size: 0.9rem;
	}

	@keyframes float {
		50% {
			transform: translateY(-5px);
		}
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
	}
</style>
