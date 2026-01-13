<script lang="ts">
	/**
	 * CyberBackground - Animated scanning grid with pulse layers
	 * The core visual foundation for DevPulse
	 *
	 * Layers (back to front):
	 * 1. bg-base - Ambient gradient
	 * 2. branded-bg - DevPulse logo background (dimmed, animated)
	 * 3. pulse-orbs - Floating color orbs
	 * 4. grid-layer - Scanning grid lines
	 * 5. pulse-line - EKG heartbeat sweep
	 * 6. scan-line - Horizontal scan effect
	 * 7. vignette - Edge darkening
	 */
</script>

<div class="cyber-bg">
	<!-- Base gradient layer -->
	<div class="bg-base"></div>

	<!-- DevPulse branded background - dimmed, animated -->
	<div class="branded-bg">
		<div class="branded-image"></div>
		<div class="branded-glow"></div>
	</div>

	<!-- Animated pulse orbs -->
	<div class="pulse-orb orb-1"></div>
	<div class="pulse-orb orb-2"></div>
	<div class="pulse-orb orb-3"></div>

	<!-- Scanning grid lines -->
	<div class="grid-layer">
		<div class="grid-horizontal"></div>
		<div class="grid-vertical"></div>
	</div>

	<!-- EKG pulse line sweep -->
	<div class="pulse-line"></div>

	<!-- Scan line effect -->
	<div class="scan-line"></div>

	<!-- Vignette -->
	<div class="vignette"></div>
</div>

<style>
	.cyber-bg {
		position: fixed;
		inset: 0;
		z-index: -1;
		overflow: hidden;
		background: var(--dp-obsidian-950, oklch(6% 0.02 195));
	}

	/* Base ambient gradient */
	.bg-base {
		position: absolute;
		inset: 0;
		background:
			radial-gradient(
				ellipse 100% 60% at 50% 0%,
				oklch(from var(--dp-accent-primary) l c h / 0.12) 0%,
				transparent 50%
			),
			radial-gradient(
				ellipse 80% 50% at 0% 100%,
				oklch(from var(--dp-accent-primary) calc(l - 0.1) c h / 0.08) 0%,
				transparent 40%
			),
			radial-gradient(
				ellipse 60% 40% at 100% 50%,
				oklch(from var(--dp-accent-cyan) l c h / 0.06) 0%,
				transparent 35%
			);
	}

	/* Floating pulse orbs */
	.pulse-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.5;
		mix-blend-mode: screen;
	}

	.orb-1 {
		width: 600px;
		height: 600px;
		top: -200px;
		left: 20%;
		background: radial-gradient(
			circle,
			oklch(70% 0.2 195 / 0.4) 0%,
			transparent 70%
		);
		animation: orb-drift-1 12s ease-in-out infinite;
	}

	.orb-2 {
		width: 400px;
		height: 400px;
		bottom: 10%;
		right: 10%;
		background: radial-gradient(
			circle,
			oklch(65% 0.15 200 / 0.35) 0%,
			transparent 70%
		);
		animation: orb-drift-2 15s ease-in-out infinite;
	}

	.orb-3 {
		width: 500px;
		height: 500px;
		top: 40%;
		left: -100px;
		background: radial-gradient(
			circle,
			oklch(60% 0.18 190 / 0.3) 0%,
			transparent 70%
		);
		animation: orb-drift-3 18s ease-in-out infinite;
	}

	@keyframes orb-drift-1 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(50px, 30px) scale(1.1); }
		66% { transform: translate(-30px, 50px) scale(0.95); }
	}

	@keyframes orb-drift-2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(-40px, -60px) scale(1.15); }
	}

	@keyframes orb-drift-3 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(60px, -40px) scale(1.08); }
	}

	/* Grid layer */
	.grid-layer {
		position: absolute;
		inset: 0;
		perspective: 1000px;
		overflow: hidden;
	}

	.grid-horizontal,
	.grid-vertical {
		position: absolute;
		inset: 0;
	}

	.grid-horizontal {
		background-image: repeating-linear-gradient(
			0deg,
			transparent 0px,
			transparent 39px,
			oklch(70% 0.15 195 / 0.08) 39px,
			oklch(70% 0.15 195 / 0.08) 40px
		);
		animation: grid-scroll-y 20s linear infinite;
	}

	.grid-vertical {
		background-image: repeating-linear-gradient(
			90deg,
			transparent 0px,
			transparent 39px,
			oklch(70% 0.15 195 / 0.06) 39px,
			oklch(70% 0.15 195 / 0.06) 40px
		);
	}

	@keyframes grid-scroll-y {
		0% { transform: translateY(0); }
		100% { transform: translateY(40px); }
	}

	/* Scan line effect */
	.scan-line {
		position: absolute;
		left: 0;
		right: 0;
		height: 2px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			oklch(75% 0.2 195 / 0.6) 20%,
			oklch(80% 0.2 195 / 0.8) 50%,
			oklch(75% 0.2 195 / 0.6) 80%,
			transparent 100%
		);
		box-shadow:
			0 0 20px oklch(70% 0.2 195 / 0.5),
			0 0 40px oklch(70% 0.15 195 / 0.3);
		animation: scan 8s ease-in-out infinite;
	}

	@keyframes scan {
		0%, 100% {
			top: -2px;
			opacity: 0;
		}
		5% { opacity: 1; }
		95% { opacity: 1; }
		100% {
			top: 100%;
			opacity: 0;
		}
	}

	/* Vignette */
	.vignette {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 70% 60% at 50% 50%,
			transparent 0%,
			oklch(0% 0 0 / 0.4) 100%
		);
		pointer-events: none;
	}

	/* ================================================
	   BRANDED BACKGROUND - DevPulse Logo Layer
	   Dimmed, animated, shows through glass cracks
	   ================================================ */

	.branded-bg {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	/* Main branded image - heavily dimmed */
	.branded-image {
		position: absolute;
		inset: 0;
		background-image: url('/imgs/backgrounds/maincontentbackground.png');
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		opacity: 0.12;

		/* Breathing + drift animation */
		animation:
			branded-breathe 8s ease-in-out infinite,
			branded-drift 60s ease-in-out infinite;
		transform-origin: center;
	}

	/* Glow overlay on the logo */
	.branded-glow {
		position: absolute;
		inset: 0;

		/* Center glow on the DP logo - ice/fire colors */
		background:
			/* Cyan glow on D (ice) */
			radial-gradient(
				ellipse 25% 35% at 35% 45%,
				oklch(70% 0.2 195 / 0.08) 0%,
				transparent 70%
			),
			/* Orange glow on P (fire) */
			radial-gradient(
				ellipse 25% 35% at 65% 45%,
				oklch(70% 0.2 45 / 0.06) 0%,
				transparent 70%
			),
			/* Center pulse line glow */
			radial-gradient(
				ellipse 60% 8% at 50% 50%,
				oklch(75% 0.2 55 / 0.1) 0%,
				transparent 100%
			);

		animation: branded-glow-pulse 6s ease-in-out infinite;
	}

	@keyframes branded-breathe {
		0%, 100% {
			opacity: 0.12;
			filter: brightness(1) saturate(1);
		}
		50% {
			opacity: 0.16;
			filter: brightness(1.15) saturate(1.2);
		}
	}

	@keyframes branded-drift {
		0%, 100% {
			background-position: center;
			transform: scale(1.02);
		}
		25% {
			background-position: 49% 51%;
		}
		50% {
			background-position: 51% 49%;
			transform: scale(1.05);
		}
		75% {
			background-position: 50% 51%;
		}
	}

	@keyframes branded-glow-pulse {
		0%, 100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.03);
		}
	}

	/* ================================================
	   EKG PULSE LINE - Heartbeat Sweep
	   ================================================ */

	.pulse-line {
		position: absolute;
		left: 0;
		right: 0;
		top: 50%;
		height: 2px;
		pointer-events: none;
		z-index: 3;

		/* Orange/cyan gradient matching DP heartbeat line */
		background: linear-gradient(
			90deg,
			transparent 0%,
			oklch(75% 0.2 30 / 0) 5%,
			oklch(75% 0.25 45 / 0.8) 15%,
			oklch(85% 0.25 195 / 1) 50%,
			oklch(75% 0.2 195 / 0.8) 85%,
			oklch(75% 0.2 195 / 0) 95%,
			transparent 100%
		);

		box-shadow:
			0 0 15px oklch(70% 0.2 195 / 0.5),
			0 0 30px oklch(70% 0.15 195 / 0.3),
			0 0 5px oklch(80% 0.25 55 / 0.4);

		transform: translateX(-100%);
		animation: pulse-sweep 12s ease-in-out infinite;
		animation-delay: 2s;
	}

	@keyframes pulse-sweep {
		0% {
			transform: translateX(-100%);
			opacity: 0;
		}
		5% {
			opacity: 1;
		}
		95% {
			opacity: 1;
		}
		100% {
			transform: translateX(100%);
			opacity: 0;
		}
	}
</style>
