<!-- Two thermometers on a seesaw: raising one lowers the other. -->
<script lang="ts">
	import Thermometer from '../Thermometer.svelte';
</script>

<div class="seesaw" aria-hidden="true">
	<div class="plank">
		<span class="seat left"><Thermometer thermometer="parity" height={70} /></span>
		<span class="seat right"
			><Thermometer thermometer="counterfactual" level={0.55} height={70} /></span
		>
	</div>
	<div class="pivot"></div>
	<div class="ground"></div>
</div>

<style>
	.seesaw {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		width: min(100%, 16rem);
		height: 9rem;
	}

	.plank {
		position: relative;
		width: 70%;
		height: 7px;
		border-radius: 4px;
		background: #8a8070;
		transform: rotate(-12deg);
		animation: tilt 3.6s ease-in-out infinite alternate;
	}

	.seat {
		position: absolute;
		bottom: 4px;
	}

	.left {
		left: 4%;
	}

	.right {
		right: 4%;
	}

	.pivot {
		width: 0;
		height: 0;
		border-left: 14px solid transparent;
		border-right: 14px solid transparent;
		border-bottom: 20px solid var(--ink);
	}

	.ground {
		width: 76%;
		height: 3px;
		border-radius: 2px;
		background: var(--line);
	}

	@keyframes tilt {
		from {
			transform: rotate(-12deg);
		}
		to {
			transform: rotate(-4deg);
		}
	}
</style>
