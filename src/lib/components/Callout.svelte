<!-- A key takeaway in an orange side-barred box; **double asterisks** mark bold text. -->
<script lang="ts">
	import RichText from './RichText.svelte';

	let { text }: { text: string } = $props();
</script>

<p class="callout"><RichText {text} /></p>

<style>
	.callout {
		margin: 0;
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--accent);
		border-radius: var(--radius-s);
		background: var(--accent-soft);
		font-family: var(--font-display);
		font-size: 1.1rem;
		line-height: 1.35;
	}
</style>
