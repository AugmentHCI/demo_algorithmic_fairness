<!-- The "jij" tag under your own avatar, so you can find yourself among the others. Its parent must be positioned. -->
<script lang="ts">
	import { getI18n } from '$lib/i18n/index.svelte';

	/** `small` for the densely packed crowd. */
	let { small = false }: { small?: boolean } = $props();

	const i18n = getI18n();
</script>

<span class={['you-tag', small && 'small']}>{i18n.t.common.you}</span>

<style>
	.you-tag {
		position: absolute;
		bottom: -7px;
		left: 50%;
		translate: -50% 0;
		padding-inline: 5px;
		border-radius: 999px;
		background: var(--ink);
		color: var(--surface);
		font-size: 0.5625rem;
		font-weight: 700;
		line-height: 12px;
		letter-spacing: 0.02em;
		white-space: nowrap;
	}

	.small {
		padding-inline: 4px;
		font-size: 0.5rem;
		line-height: 11px;
	}
</style>
