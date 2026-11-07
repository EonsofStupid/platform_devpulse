<script lang="ts">
	/**
	 * ArcGauge - Circular progress gauge with glow
	 * Like the Projects (8/12) and Success (94/100) from mockup
	 */
	interface Props {
		value: number;
		max: number;
		label: string;
		color?: 'cyan' | 'green' | 'orange' | 'red';
		size?: number;
	}

	let {
		value,
		max,
		label,
		color = 'cyan',
		size = 140
	}: Props = $props();

	const percent = $derived((value / max) * 100);
	const circumference = $derived(2 * Math.PI * 45); // radius 45
	const strokeDashoffset = $derived(circumference - (percent / 100) * circumference);

	const colorMap = {
		cyan: 'oklch(75% 0.18 195)',
		green: 'oklch(72% 0.18 145)',
		orange: 'oklch(75% 0.2 55)',
		red: 'oklch(62% 0.25 25)'
	};

	const glowColor = $derived(colorMap[color]);
</script>

<div class="arc-gauge" style:--gauge-color={glowColor} style:--size={size + 'px'}>
	<svg viewBox="0 0 100 100" class="gauge-svg">
		<!-- Background track -->
		<circle
			cx="50"
			cy="50"
			r="45"
			fill="none"
			stroke="oklch(20% 0.02 195 / 0.5)"
			stroke-width="6"
		/>
		<!-- Progress arc -->
		<circle
			cx="50"
			cy="50"
			r="45"
			fill="none"
			stroke={glowColor}
			stroke-width="6"
			stroke-linecap="round"
			stroke-dasharray={circumference}
			stroke-dashoffset={strokeDashoffset}
			transform="rotate(-90 50 50)"
			class="progress-arc"
		/>
		<!-- Glow filter -->
		<defs>
			<filter id="glow-{color}" x="-50%" y="-50%" width="200%" height="200%">
				<feGaussianBlur stdDeviation="3" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
	</svg>

	<div class="gauge-content">
		<span class="gauge-value">{value}</span>
		<span class="gauge-divider">/{max}</span>
	</div>

	<div class="gauge-label">{label}</div>
</div>

<style>
	.arc-gauge {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		position: relative;
	}

	.gauge-svg {
		width: var(--size);
		height: var(--size);
		filter: drop-shadow(0 0 8px var(--gauge-color));
	}

	.progress-arc {
		transition: stroke-dashoffset 0.8s ease-out;
		filter: url(#glow-cyan);
	}

	.gauge-content {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -70%);
		display: flex;
		align-items: baseline;
		gap: 2px;
	}

	.gauge-value {
		font-size: calc(var(--size) * 0.28);
		font-weight: 700;
		color: var(--dp-text-primary, white);
		font-family: var(--dp-font-mono, monospace);
		text-shadow: 0 0 12px var(--gauge-color);
	}

	.gauge-divider {
		font-size: calc(var(--size) * 0.12);
		color: var(--dp-text-muted);
		font-family: var(--dp-font-mono, monospace);
	}

	.gauge-label {
		font-size: 0.875rem;
		color: var(--dp-text-secondary);
		font-weight: 500;
		text-align: center;
	}
</style>
