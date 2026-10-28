<!-- "Kop in het zand": an ostrich with its head buried in a mound of sand. -->
<svg viewBox="0 0 200 110" width="100%" style:max-width="260px" aria-hidden="true">
	<!-- ground -->
	<line x1="8" y1="96" x2="192" y2="96" stroke="#e5e0d6" stroke-width="3" stroke-linecap="round" />

	<!-- legs: thigh down, backward-bending ankle, toes forward -->
	<g fill="none" stroke="#1d1811" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
		<path d="M70 62 L76 78 L68 95 L78 95" />
		<path d="M92 62 L98 78 L92 95 L102 95" />
	</g>

	<!-- neck, curving down into the sand -->
	<path
		d="M108 42 C 128 20, 150 28, 156 56 S 160 80, 161 88"
		fill="none"
		stroke="#1d1811"
		stroke-width="10"
		stroke-linecap="round"
	/>
	<path
		d="M108 42 C 128 20, 150 28, 156 56 S 160 80, 161 88"
		fill="none"
		stroke="#f3c6ad"
		stroke-width="5"
		stroke-linecap="round"
	/>

	<!-- tail plume -->
	<g class="tail" fill="#fff" stroke="#1d1811" stroke-width="2.5" stroke-linejoin="round">
		<path d="M50 44 C 30 34, 22 22, 30 16 C 38 22, 46 30, 56 38 Z" />
		<path d="M48 50 C 26 48, 16 38, 20 30 C 30 34, 42 40, 54 44 Z" />
	</g>

	<!-- feathered body -->
	<path
		d="M48 44 C 50 26, 78 20, 100 26 C 116 30, 120 44, 114 54
		   Q 108 60 100 60 Q 96 66 88 62 Q 82 68 74 62 Q 66 66 60 60 Q 50 58 48 44 Z"
		fill="#1d1811"
	/>
	<path
		d="M66 34 C 78 28, 96 30, 104 40"
		fill="none"
		stroke="#5a5245"
		stroke-width="3"
		stroke-linecap="round"
	/>
	<path
		d="M70 42 C 80 38, 92 40, 98 46"
		fill="none"
		stroke="#5a5245"
		stroke-width="2.5"
		stroke-linecap="round"
	/>

	<!-- sand mound hiding the head -->
	<path
		d="M136 96 Q 142 78 161 76 Q 180 78 186 96 Z"
		fill="#f2e3c2"
		stroke="#1d1811"
		stroke-width="2.5"
		stroke-linejoin="round"
	/>
	<g fill="#d8c294">
		<circle cx="152" cy="88" r="1.5" />
		<circle cx="168" cy="85" r="1.5" />
		<circle cx="174" cy="91" r="1.5" />
		<circle cx="146" cy="93" r="1.2" />
	</g>
	<!-- flying grains -->
	<g class="grains" fill="#d8c294">
		<circle cx="140" cy="72" r="1.8" />
		<circle cx="184" cy="70" r="1.8" />
		<circle cx="178" cy="62" r="1.3" />
	</g>
</svg>

<style>
	svg {
		display: block;
		margin-inline: auto;
		overflow: visible;
	}

	.tail {
		transform-origin: 54px 44px;
		animation: wiggle 2.4s ease-in-out infinite;
	}

	.grains {
		animation: grains 2.4s ease-in-out infinite;
	}

	@keyframes wiggle {
		50% {
			transform: rotate(-6deg);
		}
	}

	@keyframes grains {
		0%,
		100% {
			opacity: 0;
			translate: 0 4px;
		}
		50% {
			opacity: 1;
			translate: 0 -2px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tail,
		.grains {
			animation: none;
		}
	}
</style>
