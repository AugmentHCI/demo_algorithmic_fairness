<!--
	"Dat ga jij zelf beleven": applicants queueing on either side of the cut-off.
	The ones in front are invited (and happy about it), the rest wait behind the line.
-->
<script lang="ts">
	import type { Shape } from '$lib/domain/types';
	import ShapeGlyph, { type Face } from '../ShapeGlyph.svelte';

	interface Applicant {
		readonly shape: Shape;
		readonly fill: string;
		readonly face: Face;
	}

	const INVITED: readonly Applicant[] = [
		{ shape: 'circle', fill: '#0072b2', face: 'happy' },
		{ shape: 'triangle', fill: '#009e73', face: 'happy' }
	];
	const WAITING: readonly Applicant[] = [
		{ shape: 'square', fill: '#e6a100', face: 'neutral' },
		{ shape: 'circle', fill: '#cc79a7', face: 'sad' },
		{ shape: 'triangle', fill: '#d55e00', face: 'neutral' }
	];
</script>

{#snippet queue(applicants: readonly Applicant[], offset: number)}
	{#each applicants as applicant, i (i)}
		<span class="applicant" style:animation-delay="{(offset + i) * -0.4}s">
			<ShapeGlyph shape={applicant.shape} fill={applicant.fill} face={applicant.face} px={40} />
		</span>
	{/each}
{/snippet}

<div class="line-up" aria-hidden="true">
	<div class="group invited">{@render queue(INVITED, 0)}</div>
	<span class="cut-off"></span>
	<div class="group waiting">{@render queue(WAITING, INVITED.length)}</div>
</div>

<style>
	.line-up {
		display: flex;
		align-items: stretch;
		gap: var(--space-3);
		width: min(100%, 20rem);
		margin-inline: auto;
	}

	.group {
		display: flex;
		align-items: flex-end;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3) var(--space-3);
		border-radius: var(--radius-s);
	}

	.invited {
		background: var(--good-soft);
	}

	.waiting {
		flex: 1;
		background: #eeebe4;
	}

	/*
	 * Drawn as a gradient rather than a dashed border: WebKit (every browser on
	 * iOS) paints a dashed border on a zero-width box as a single dash.
	 */
	.cut-off {
		flex: none;
		width: 2.5px;
		background: repeating-linear-gradient(to bottom, var(--accent) 0 7px, transparent 7px 12px);
	}

	.applicant {
		animation: bob 2.4s ease-in-out infinite;
	}

	@keyframes bob {
		50% {
			translate: 0 -3px;
		}
	}
</style>
