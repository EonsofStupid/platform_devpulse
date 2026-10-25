<script lang="ts">
	/**
	 * SignalsCard - Shows active signals/patterns detected
	 * Typing speed, error spikes, activity levels
	 */
	import type { ActiveSignal } from '$lib/types/connections';

	interface Props {
		signals?: ActiveSignal[];
		keystrokesPerMin?: number;
		errorsToday?: number;
	}

	let {
		signals = [],
		keystrokesPerMin = 0,
		errorsToday = 0
	}: Props = $props();

	// Get top 2 signals for display
	const topSignals = $derived(signals.slice(0, 2));

	// Severity colors
	const severityColor = (severity: 'info' | 'warning' | 'critical') => {
		switch (severity) {
			case 'critical': return 'var(--dp-error)';
			case 'warning': return 'var(--dp-warning)';
			default: return 'var(--dp-accent-primary)';
		}
	};
</script>

<div class="signals-card">
	<div class="card-header">
		<span class="card-title">ACTIVE SIGNALS</span>
		<span class="signal-count">{signals.length}</span>
	</div>

	<div class="signals-list">
		{#if topSignals.length > 0}
			{#each topSignals as signal}
				<div
					class="signal-item"
					class:info={signal.severity === 'info'}
					class:warning={signal.severity === 'warning'}
					class:critical={signal.severity === 'critical'}
				>
					<span class="signal-dot" style="background: {severityColor(signal.severity)}"></span>
					<span class="signal-label">{signal.label}</span>
				</div>
			{/each}
		{:else}
			<div class="no-signals">No active signals</div>
		{/if}
	</div>

	<div class="metrics-row">
		<div class="metric">
			<span class="metric-value">{keystrokesPerMin}</span>
			<span class="metric-label">KEYSTROKES/MIN</span>
		</div>
		<div class="metric">
			<span class="metric-value" class:error={errorsToday > 0}>{errorsToday}</span>
			<span class="metric-label">ERRORS TODAY</span>
		</div>
	</div>
</div>

<style>
	.signals-card {
		/* Orange/Amber tint for signals cards */
		--glass-tint: var(--glass-hue-orange, 30);
		--border-tint: var(--glass-hue-amber, 45);

		background: var(--dp-glass-bg);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		border: 2px solid var(--dp-border-accent);
		border-radius: var(--dp-radius-lg, 12px);
		padding: var(--dp-space-4, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);

		/* Bevel effect using local tint */
		box-shadow:
			inset 2px 2px 0 oklch(75% 0.08 var(--glass-tint) / 0.25),
			inset -2px -2px 0 oklch(20% 0.08 var(--glass-tint) / 0.5),
			inset 3px 3px 2px oklch(80% 0.12 var(--glass-tint) / 0.35),
			inset -3px -3px 2px oklch(12% 0.1 var(--glass-tint) / 0.7),
			0 4px 24px var(--dp-glass-shadow);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.card-title {
		font-size: var(--dp-text-xs, 0.75rem);
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.signal-count {
		font-size: var(--dp-text-xs, 0.75rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-accent-primary);
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		padding: 2px 8px;
		border-radius: var(--dp-radius-sm, 4px);
	}

	.signals-list {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
	}

	.signal-item {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-2, 0.5rem);
		background: var(--dp-glass-inset-bg-light);
		border-radius: var(--dp-radius, 8px);
		border: 1px solid oklch(55% 0.12 var(--glass-tint) / 0.3);
	}

	.signal-item.warning {
		border-color: oklch(from var(--dp-warning) l c h / 0.4);
		background: oklch(from var(--dp-warning) l c h / 0.1);
	}

	.signal-item.critical {
		border-color: oklch(from var(--dp-error) l c h / 0.4);
		background: oklch(from var(--dp-error) l c h / 0.1);
	}

	.signal-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.signal-label {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-secondary);
		font-weight: var(--dp-font-medium, 500);
	}

	.no-signals {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-dim);
		font-style: italic;
		padding: var(--dp-space-2, 0.5rem);
	}

	.metrics-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--dp-space-3, 0.75rem);
		margin-top: auto;
	}

	.metric {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		padding: var(--dp-space-2, 0.5rem);
		background: var(--dp-glass-inset-bg-light);
		border-radius: var(--dp-radius, 8px);
		border: 1px solid oklch(55% 0.12 var(--glass-tint) / 0.2);
	}

	.metric-value {
		font-size: var(--dp-text-xl, 1.25rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-text-primary);
		font-family: var(--dp-font-mono, monospace);
	}

	.metric-value.error {
		color: var(--dp-error);
	}

	.metric-label {
		font-size: 0.625rem;
		color: var(--dp-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
