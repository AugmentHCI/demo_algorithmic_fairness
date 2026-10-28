<!-- The bordered message card of the design: what a rule means for you. -->
<script lang="ts">
	interface Props {
		title: string;
		detail?: string;
	}

	let { title, detail }: Props = $props();
</script>

<div class="outcome" role="status">
	<p class="title">{title}</p>
	{#if detail}<p class="detail">{detail}</p>{/if}
</div>

<style>
	.outcome {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding: var(--space-4);
		border: 2px solid var(--accent-line);
		border-radius: var(--radius-m);
		background: var(--surface);
		animation: pop 450ms var(--ease-out) both;
	}

	.title {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 1.15rem;
		line-height: 1.25;
	}

	.detail {
		font-size: 0.95rem;
	}

	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.97);
		}
	}
</style>
