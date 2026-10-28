<script lang="ts">
	import '@fontsource-variable/inter';
	import '@fontsource-variable/bricolage-grotesque';
	import '../app.css';
	import { I18n, setI18n } from '$lib/i18n/index.svelte';

	let { children } = $props();

	const i18n = setI18n(new I18n());

	$effect(() => {
		document.documentElement.lang = i18n.locale;
	});
</script>

<svelte:head>
	<title>{i18n.t.meta.title}</title>
	<meta name="description" content={i18n.t.meta.description} />
</svelte:head>

{@render children()}
