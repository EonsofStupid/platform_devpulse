<script lang="ts">
	/**
	 * GaugeArc - Circular progress gauge with glow
	 * Uses --dp-* design tokens
	 */
	interface Props {
		value?: number;
		max?: number;
		label?: string;
		sublabel?: string;
		color?: string;
	}

	let {
		value = 70,
		max = 100,
		label = 'Usage',
		sublabel = '',
		color = 'var(--dp-accent-primary)'
	}: Props = $props();

	const percentage = $derived(Math.min(100, Math.max(0, (value / max) * 100)));
	const circumference = $derived(2 * Math.PI * 45);
	const arcLength = $derived(circumference * 0.75); // 270 degrees
	const filledLength = $derived((percentage / 100) * arcLength);
	const strokeDashoffset = $derived(arcLength - filledLength);
</script>

<div class="gauge">
	<svg viewBox="0 0 100 100">
		<!-- Background arc -->
		<circle
			cx="50" cy="50" r="45"
			fill="none"
			stroke="var(--dp-glass-border)"
			stroke-width="8"
			stroke-linecap="round"
			stroke-dasharray={arcLength}
			stroke-dashoffset="0"
			transform="rotate(135 50 50)"
		/>
		<!-- Value arc -->
		<circle
			cx="50" cy="50" r="45"
			fill="none"
			stroke={color}
			stroke-width="8"
			stroke-linecap="round"
			stroke-dasharray={arcLength}
			stroke-dashoffset={strokeDashoffset}
			transform="rotate(135 50 50)"
			class="value-arc"
			style="--glow-color: {color};"
		/>
	</svg>
	<div class="gauge-content">
		<span class="gauge-value" style="color: {color}">{percentage.toFixed(0)}%</span>
		<span class="gauge-label">{label}</span>
		{#if sublabel}<span class="gauge-sublabel">{sublabel}</span>{/if}
	</div>
</div>

<style>
	.gauge {
		position: relative;
		width: 140px;
		height: 140px;
	}

	svg {
		width: 100%;
		height: 100%;
		filter: drop-shadow(0 0 4px var(--dp-glass-shadow));
	}

	.value-arc {
		filter: drop-shadow(0 0 12px var(--glow-color));
		transition: stroke-dashoffset 0.5s ease;
	}

	.gauge-content {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding-top: 10px;
	}

	.gauge-value {
		font-size: 1.5rem;
		font-weight: var(--dp-font-bold, 700);
		font-family: var(--dp-font-mono, monospace);
		text-shadow: 0 0 12px var(--glow-color);
	}

	.gauge-label {
		font-size: var(--dp-text-xs, 0.75rem);
		color: var(--dp-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-top: 0.25rem;
	}

	.gauge-sublabel {
		font-size: 0.625rem;
		color: var(--dp-text-dim);
	}
</style>
