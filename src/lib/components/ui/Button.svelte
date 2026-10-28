<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		variant?: 'primary' | 'secondary' | 'ghost';
		/** Show a trailing arrow. */
		arrow?: boolean;
		loading?: boolean;
		children: Snippet;
	}

	let {
		variant = 'primary',
		arrow = false,
		loading = false,
		disabled = false,
		type = 'button',
		children,
		...rest
	}: Props = $props();
</script>

<button
	{...rest}
	{type}
	class={['button', variant, rest.class]}
	disabled={disabled || loading}
	aria-busy={loading || undefined}
>
	{#if loading}
		<LoaderCircle class="spin" size={20} aria-hidden="true" />
	{/if}
	<span class="label">{@render children()}</span>
	{#if arrow && !loading}
		<ArrowRight size={20} aria-hidden="true" />
	{/if}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-height: 3.25rem;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-m);
		border: 2px solid transparent;
		font-weight: 700;
		/* ≥ 18.66px bold counts as large text: white on the brand orange then meets WCAG AA. */
		font-size: 1.1875rem;
		line-height: 1.2;
		text-align: center;
		cursor: pointer;
		touch-action: manipulation;
		transition:
			transform 120ms var(--ease-out),
			background-color 150ms,
			opacity 150ms;
	}

	.label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.button:active:not(:disabled) {
		transform: scale(0.97);
	}

	.button:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.primary {
		width: 100%;
		background: var(--accent);
		color: #fff;
	}

	@media (hover: hover) {
		.primary:hover:not(:disabled) {
			background: var(--accent-strong);
		}

		.secondary:hover:not(:disabled) {
			background: var(--card);
		}
	}

	.secondary {
		background: var(--surface);
		border-color: var(--line);
		color: var(--ink);
	}

	.ghost {
		background: transparent;
		color: var(--muted);
		min-height: 2.75rem;
		padding-inline: var(--space-3);
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.button :global(.spin) {
		animation: spin 0.9s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
