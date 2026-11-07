<script lang="ts">
	/**
	 * MetricsCard - Simple metric display card
	 * 
	 * Shows a label and large value with optional color accent
	 */
	interface Props {
		label: string;
		value: string | number;
		color?: 'blue' | 'purple' | 'green' | 'amber' | 'red' | 'cyan';
		unit?: string;
	}

	let { label, value, color = 'blue', unit }: Props = $props();

	function getColorClass(color: string): string {
		return `metrics-value-${color}`;
	}
</script>

<div class="metrics-card glass">
	<div class="metrics-label">{label}</div>
	<div class={`metrics-value ${getColorClass(color)}`}>
		{value}
		{#if unit}
			<span class="metrics-unit">{unit}</span>
		{/if}
	</div>
</div>

<style>
	.metrics-card {
		padding: 1rem;
	}

	.metrics-label {
		font-size: 0.875rem;
		color: #9ca3af;
		margin-bottom: 0.5rem;
	}

	.metrics-value {
		font-size: 2rem;
		font-weight: 700;
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}

	.metrics-unit {
		font-size: 1rem;
		font-weight: 400;
		color: #6b7280;
	}

	.metrics-value-blue {
		color: #6366f1;
	}

	.metrics-value-purple {
		color: #a855f7;
	}

	.metrics-value-green {
		color: #22c55e;
	}

	.metrics-value-amber {
		color: #f59e0b;
	}

	.metrics-value-red {
		color: #ef4444;
	}

	.metrics-value-cyan {
		color: #06b6d4;
	}
</style>
