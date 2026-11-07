<script lang="ts">
	/**
	 * AnimatedLogo - The ONE DevPulse logo
	 *
	 * Features:
	 * - Deep glass container
	 * - Icon with metallic ring
	 * - Letters randomly shift colors (ice/fire/cyan)
	 * - Sporadic pulse line sweeps through text
	 */
	import { onMount } from 'svelte';

	interface Props {
		size?: 'sm' | 'md' | 'lg';
		showText?: boolean;
	}

	let { size = 'md', showText = true }: Props = $props();

	// Letter color states - each letter can shift independently
	let letterColors = $state(['base', 'base', 'base', 'base', 'base', 'base', 'base', 'base']);
	const letters = ['D', 'e', 'v', 'P', 'u', 'l', 's', 'e'];
	const colorClasses = ['ice', 'fire', 'cyan', 'purple', 'base'];

	// Pulse line state
	let pulseActive = $state(false);

	// Random color shifts
	function shiftRandomLetter() {
		const idx = Math.floor(Math.random() * letters.length);
		const newColor = colorClasses[Math.floor(Math.random() * colorClasses.length)];
		letterColors[idx] = newColor;

		// Reset after delay
		setTimeout(() => {
			letterColors[idx] = 'base';
		}, 800 + Math.random() * 1200);
	}

	// Sporadic pulse activation
	function triggerPulse() {
		if (!pulseActive) {
			pulseActive = true;
			setTimeout(() => {
				pulseActive = false;
			}, 1200);
		}
	}

	onMount(() => {
		// Random letter color shifts (every 1-3 seconds)
		const colorInterval = setInterval(() => {
			if (Math.random() > 0.4) shiftRandomLetter();
		}, 1000 + Math.random() * 2000);

		// Sporadic pulse (every 4-8 seconds)
		const pulseInterval = setInterval(() => {
			if (Math.random() > 0.3) triggerPulse();
		}, 4000 + Math.random() * 4000);

		return () => {
			clearInterval(colorInterval);
			clearInterval(pulseInterval);
		};
	});

	// Size mappings
	const sizes = {
		sm: { icon: 32, text: '1rem', gap: '0.5rem' },
		md: { icon: 48, text: '1.25rem', gap: '0.75rem' },
		lg: { icon: 64, text: '1.5rem', gap: '1rem' }
	};

	let sizeConfig = $derived(sizes[size]);
</script>

<div
	class="animated-logo"
	class:size-sm={size === 'sm'}
	class:size-md={size === 'md'}
	class:size-lg={size === 'lg'}
>
	<!-- Icon with metallic ring -->
	<div class="logo-icon-container">
		<div class="metallic-ring">
			<img
				src="/imgs/devpulse_icon_activity_pack/devpulse_icon_thick_{sizeConfig.icon}.png"
				alt="DevPulse"
				class="logo-icon"
				width={sizeConfig.icon}
				height={sizeConfig.icon}
			/>
		</div>
		<div class="icon-glow"></div>
	</div>

	<!-- Animated text -->
	{#if showText}
		<div class="logo-text-container">
			<span class="logo-text">
				{#each letters as letter, i}
					<span class="letter" class:ice={letterColors[i] === 'ice'} class:fire={letterColors[i] === 'fire'} class:cyan={letterColors[i] === 'cyan'} class:purple={letterColors[i] === 'purple'}>{letter}</span>
				{/each}
			</span>

			<!-- Pulse overlay -->
			<div class="pulse-line" class:active={pulseActive}></div>
		</div>
	{/if}
</div>

<style>
	.animated-logo {
		display: flex;
		align-items: center;
		gap: var(--dp-space-3);
		position: relative;
	}

	/* Size variants */
	.size-sm { gap: 0.5rem; }
	.size-md { gap: 0.75rem; }
	.size-lg { gap: 1rem; }

	/* Icon container with metallic ring effect */
	.logo-icon-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.metallic-ring {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 50%;

		/* Deep metallic bevel */
		background: linear-gradient(
			145deg,
			oklch(85% 0.01 0) 0%,
			oklch(60% 0.02 0) 25%,
			oklch(35% 0.02 0) 50%,
			oklch(60% 0.02 0) 75%,
			oklch(85% 0.01 0) 100%
		);

		box-shadow:
			/* Outer chrome bevel */
			inset 3px 3px 0 oklch(95% 0.01 0 / 0.9),
			inset -3px -3px 0 oklch(10% 0.02 0 / 0.8),
			/* Inner glow - purple */
			inset 0 0 15px oklch(55% 0.25 280 / 0.5),
			/* Drop shadow */
			0 4px 12px oklch(0% 0 0 / 0.4);
	}

	.logo-icon {
		display: block;
		border-radius: 50%;
		position: relative;
		z-index: 1;
	}

	.icon-glow {
		position: absolute;
		inset: -8px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			oklch(60% 0.2 280 / 0.3) 0%,
			transparent 70%
		);
		animation: icon-glow-pulse 4s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes icon-glow-pulse {
		0%, 100% { opacity: 0.5; transform: scale(1); }
		50% { opacity: 0.8; transform: scale(1.1); }
	}

	/* Text container */
	.logo-text-container {
		position: relative;
		overflow: hidden;
	}

	.logo-text {
		display: flex;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.size-sm .logo-text { font-size: 1rem; }
	.size-md .logo-text { font-size: 1.25rem; }
	.size-lg .logo-text { font-size: 1.5rem; }

	/* Individual letters */
	.letter {
		display: inline-block;
		transition: color 0.3s ease, text-shadow 0.3s ease;
		color: var(--dp-text-primary);
	}

	/* Color states */
	.letter.ice {
		color: oklch(75% 0.15 195);
		text-shadow: 0 0 12px oklch(70% 0.2 195 / 0.8);
	}

	.letter.fire {
		color: oklch(75% 0.2 45);
		text-shadow: 0 0 12px oklch(70% 0.25 45 / 0.8);
	}

	.letter.cyan {
		color: oklch(80% 0.15 190);
		text-shadow: 0 0 12px oklch(75% 0.2 190 / 0.8);
	}

	.letter.purple {
		color: oklch(70% 0.2 280);
		text-shadow: 0 0 12px oklch(65% 0.25 280 / 0.8);
	}

	/* Pulse line overlay */
	.pulse-line {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 20px;
		pointer-events: none;
		opacity: 0;
		transform: translateX(-100%);

		background: linear-gradient(
			90deg,
			transparent 0%,
			oklch(75% 0.25 45 / 0.6) 30%,
			oklch(90% 0.2 195 / 1) 50%,
			oklch(75% 0.25 195 / 0.6) 70%,
			transparent 100%
		);

		box-shadow:
			0 0 15px oklch(80% 0.2 195 / 0.8),
			0 0 30px oklch(70% 0.15 195 / 0.4);
	}

	.pulse-line.active {
		opacity: 1;
		animation: pulse-sweep 1s ease-out forwards;
	}

	@keyframes pulse-sweep {
		0% {
			transform: translateX(-100%);
			opacity: 0;
		}
		10% {
			opacity: 1;
		}
		90% {
			opacity: 1;
		}
		100% {
			transform: translateX(500%);
			opacity: 0;
		}
	}
</style>
