<!-- "Er zijn honderden sollicitaties": a pile of CVs with yours on top. -->
<script lang="ts">
	import CvSheet from './CvSheet.svelte';

	let { label }: { label: string } = $props();
</script>

<div class="pile" aria-hidden="true">
	<span class="back one"><CvSheet plain tilt={-6} width={70} /></span>
	<span class="back two"><CvSheet plain tilt={-3} width={70} /></span>
	<span class="mine"><CvSheet {label} tilt={0} width={74} /></span>
</div>

<style>
	.pile {
		position: relative;
		width: 180px;
		height: 120px;
		margin-inline: auto;
	}

	.pile > span {
		position: absolute;
		top: 10px;
		animation: slide 600ms var(--ease-out) both;
	}

	.one {
		left: 0;
		top: 22px;
	}

	.two {
		left: 44px;
		top: 16px;
		animation-delay: 120ms;
	}

	.mine {
		left: 96px;
		top: 0;
		animation-delay: 260ms;
	}

	@keyframes slide {
		from {
			opacity: 0;
			transform: translateY(-16px);
		}
	}
</style>
