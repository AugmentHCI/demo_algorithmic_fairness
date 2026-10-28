<!--
	A row of mutually exclusive options. Built on native radio buttons, so
	arrow keys, focus and screen-reader announcements work out of the box.
-->
<script lang="ts" generics="T extends string">
	interface Option {
		readonly value: T;
		readonly label: string;
		/** A smaller second line under the label. */
		readonly hint?: string;
		/** Language of the hint, when it differs from the page. */
		readonly hintLang?: string;
	}

	interface Props {
		/** Accessible name of the group. */
		legend: string;
		options: readonly Option[];
		value: T;
	}

	let { legend, options, value = $bindable() }: Props = $props();

	const name = $props.id();
</script>

<fieldset class="segmented">
	<legend class="visually-hidden">{legend}</legend>
	{#each options as option (option.value)}
		<label class={{ selected: option.value === value }}>
			<input class="visually-hidden" type="radio" {name} value={option.value} bind:group={value} />
			{option.label}
			{#if option.hint}
				<span class="hint" lang={option.hintLang}>{option.hint}</span>
			{/if}
		</label>
	{/each}
</fieldset>

<style>
	.segmented {
		display: flex;
		gap: var(--space-1);
		margin: 0;
		padding: var(--space-1);
		border: 1px solid var(--line);
		border-radius: 999px;
		background: var(--canvas);
	}

	label {
		flex: 1;
		min-width: 0;
		display: grid;
		place-items: center;
		min-height: 2.75rem;
		padding: var(--space-1);
		border-radius: 999px;
		color: var(--muted);
		font-weight: 700;
		font-size: 0.875rem;
		line-height: 1.2;
		text-align: center;
		cursor: pointer;
		transition:
			background-color 200ms,
			color 200ms,
			box-shadow 200ms;
	}

	.hint {
		font-size: 0.75rem;
		font-weight: 600;
		line-height: 1.1;
	}

	label.selected {
		background: var(--surface);
		color: var(--ink);
		box-shadow: 0 1px 3px rgb(29 24 17 / 12%);
	}

	label:has(:focus-visible) {
		outline: 3px solid var(--accent-strong);
		outline-offset: 2px;
	}
</style>
