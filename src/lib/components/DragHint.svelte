<!-- "Sleep je cv in de doos", with a hand. Keeps its space while hidden, so nothing jumps. -->
<script lang="ts">
	import Hand from '@lucide/svelte/icons/hand';

	let { text, hidden = false }: { text: string; hidden?: boolean } = $props();
</script>

<p class="hint" class:hidden aria-hidden="true">
	<Hand size={18} />
	{text}
</p>

<style>
	.hint {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		color: var(--muted);
		font-weight: 600;
		font-size: 0.95rem;
		transition: opacity 200ms;
	}

	.hidden {
		opacity: 0;
	}
</style>
