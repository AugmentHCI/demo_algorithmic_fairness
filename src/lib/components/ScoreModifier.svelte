<!--
	A colour's bonus or penalty, written in that colour. The outline keeps it
	readable both on its own colour and on the page. It takes the font size of
	its parent; any motion is up to the parent too.
-->
<script module lang="ts">
	/** `+8`, `−4` (with a true minus sign) or `±0`. */
	export function formatModifier(value: number): string {
		if (value > 0) return `+${value}`;
		if (value < 0) return `−${Math.abs(value)}`;
		return '±0';
	}
</script>

<script lang="ts">
	let { value, colour }: { value: number; colour: string } = $props();
</script>

<span class="modifier" style:color={colour}>{formatModifier(value)}</span>

<style>
	.modifier {
		font-family: var(--font-display);
		font-size: 1em;
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		white-space: nowrap;
		-webkit-text-stroke: 0.18em var(--surface);
		paint-order: stroke fill;
	}
</style>
