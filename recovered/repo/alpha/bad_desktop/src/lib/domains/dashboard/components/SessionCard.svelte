<script lang="ts">
	/**
	 * SessionCard - Session duration and metrics display
	 * Shows duration, focus score, context switches
	 */
	import type { SessionMetrics } from '$lib/types/connections';

	interface Props {
		metrics: SessionMetrics;
	}

	let { metrics }: Props = $props();

	// Format duration as "Xh Xm"
	const formattedDuration = $derived(() => {
		const totalMinutes = Math.floor(metrics.durationMs / 60000);
		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;
		return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
	});

	// Calculate mock "change" values (in real app, compare to previous session)
	const durationChange = $derived(12); // Mock: +12%
	const focusChange = $derived(metrics.focusScore > 80 ? 5 : -3);
	const switchChange = $derived(metrics.contextSwitches < 15 ? -8 : 15);
</script>

<div class="session-cards">
	<!-- Duration Card -->
	<div class="stat-card">
		<div class="card-header">
			<span class="card-title">SESSION DURATION</span>
			<span class="card-icon">⏱️</span>
		</div>
		<div class="card-body">
			<span class="card-value">{formattedDuration()}</span>
			<span class="card-change positive">+{durationChange}%</span>
		</div>
		<div class="card-sublabel">Current coding session</div>
	</div>

	<!-- Focus Score Card -->
	<div class="stat-card">
		<div class="card-header">
			<span class="card-title">FOCUS SCORE</span>
			<span class="card-icon">🎯</span>
		</div>
		<div class="card-body">
			<span class="card-value">{metrics.focusScore}</span>
			<span class="card-change" class:positive={focusChange > 0} class:negative={focusChange < 0}>
				{focusChange > 0 ? '+' : ''}{focusChange}%
			</span>
		</div>
		<div class="card-sublabel">
			{metrics.focusScore >= 80 ? 'Above your average' : 'Below average'}
		</div>
	</div>

	<!-- Context Switches Card -->
	<div class="stat-card">
		<div class="card-header">
			<span class="card-title">CONTEXT SWITCHES</span>
			<span class="card-icon">🔄</span>
		</div>
		<div class="card-body">
			<span class="card-value">{metrics.contextSwitches}</span>
			<span class="card-change" class:positive={switchChange < 0} class:negative={switchChange > 0}>
				{switchChange > 0 ? '+' : ''}{switchChange}%
			</span>
		</div>
		<div class="card-sublabel">Last hour</div>
	</div>
</div>

<style>
	.session-cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--dp-space-4, 1rem);
	}

	.stat-card {
		/* Teal/Cyan tint for session cards */
		--glass-tint: var(--glass-hue-teal, 195);
		--border-tint: var(--glass-hue-cyan, 190);

		background: var(--dp-glass-bg);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		border-radius: var(--dp-radius-lg, 12px);
		border: 2px solid var(--dp-border-accent);
		padding: var(--dp-space-4, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);

		/* True depth bevel using local tint */
		box-shadow:
			inset 2px 2px 0 oklch(75% 0.08 var(--glass-tint) / 0.25),
			inset -2px -2px 0 oklch(20% 0.08 var(--glass-tint) / 0.5),
			inset 3px 3px 2px oklch(80% 0.12 var(--glass-tint) / 0.35),
			inset -3px -3px 2px oklch(12% 0.1 var(--glass-tint) / 0.7),
			0 4px 24px var(--dp-glass-shadow);

		transition: all 0.2s ease;
	}

	.stat-card:hover {
		border-color: var(--dp-border-accent-bright);
		box-shadow:
			inset 2px 2px 0 oklch(75% 0.08 var(--glass-tint) / 0.25),
			inset -2px -2px 0 oklch(20% 0.08 var(--glass-tint) / 0.5),
			inset 3px 3px 2px oklch(80% 0.12 var(--glass-tint) / 0.35),
			inset -3px -3px 2px oklch(12% 0.1 var(--glass-tint) / 0.7),
			0 0 16px var(--dp-border-glow),
			0 6px 28px var(--dp-glass-shadow);
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

	.card-icon {
		font-size: 1.25rem;
	}

	.card-body {
		display: flex;
		align-items: baseline;
		gap: var(--dp-space-3, 0.75rem);
	}

	.card-value {
		font-size: var(--dp-text-3xl, 1.875rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-text-primary);
		font-family: var(--dp-font-mono, monospace);
	}

	.card-change {
		font-size: var(--dp-text-sm, 0.875rem);
		font-weight: var(--dp-font-semibold, 600);
		padding: 2px 8px;
		border-radius: var(--dp-radius, 8px);
	}

	.card-change.positive {
		color: var(--dp-success);
		background: oklch(from var(--dp-success) l c h / 0.15);
	}

	.card-change.negative {
		color: var(--dp-error);
		background: oklch(from var(--dp-error) l c h / 0.15);
	}

	.card-sublabel {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-muted);
	}

	/* Responsive */
	@media (max-width: 768px) {
		.session-cards {
			grid-template-columns: 1fr;
		}
	}
</style>
