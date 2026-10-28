<!--
	The orange label the box hands out: a score, or "#" for "a rank". A pending
	tag is an empty dashed outline: the score the box has not handed out yet.
-->
<script lang="ts">
	interface Props {
		value: string | number;
		/** `small` hangs under an applicant's avatar; `hero` is the one score a screen is about. */
		size?: 'small' | 'medium' | 'large' | 'hero';
		pending?: boolean;
	}

	let { value, size = 'medium', pending = false }: Props = $props();
</script>

<span class={['tag', size, { pending }]}>{value}</span>

<style>
	.tag {
		display: inline-grid;
		place-items: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 0.45rem;
		border: 2px solid var(--accent);
		border-radius: 8px;
		background: var(--accent);
		color: #fff;
		font-family: var(--font-display);
		font-weight: 800;
		font-size: 1rem;
		font-variant-numeric: tabular-nums;
		transition:
			background-color 250ms,
			color 250ms;
	}

	.large {
		min-width: 3rem;
		height: 2.75rem;
		font-size: 1.4rem;
		border-radius: 10px;
	}

	.hero {
		min-width: 5.5rem;
		height: 4.75rem;
		padding: 0 0.9rem;
		border-width: 3px;
		border-radius: var(--radius-m);
		font-size: 2.9rem;
	}

	.small {
		min-width: 1.75rem;
		height: 1.4rem;
		padding: 0 0.3rem;
		border-radius: 6px;
		font-size: 0.8rem;
	}

	.pending {
		border-style: dashed;
		background: var(--surface);
		color: var(--accent-strong);
	}
</style>
