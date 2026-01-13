<script lang="ts">
	/**
	 * StatCard - Dashboard metric card
	 * Shows value, label, sublabel, and change indicator
	 */
	interface Props {
		title: string;
		value: string;
		sublabel?: string;
		change?: number;
		icon?: string;
	}

	let { title, value, sublabel, change, icon }: Props = $props();

	const changeClass = $derived(
		change === undefined ? '' :
		change > 0 ? 'positive' :
		change < 0 ? 'negative' : 'neutral'
	);
</script>

<div class="stat-card">
	<div class="card-header">
		<span class="card-title">{title}</span>
		{#if icon}
			<span class="card-icon">{icon}</span>
		{/if}
	</div>

	<div class="card-body">
		<span class="card-value">{value}</span>
		{#if change !== undefined}
			<span class="card-change {changeClass}">
				{change > 0 ? '+' : ''}{change}%
			</span>
		{/if}
	</div>

	{#if sublabel}
		<div class="card-sublabel">{sublabel}</div>
	{/if}
</div>

<style>
	.stat-card {
		background: var(--dp-glass-bg);
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		border: 2px solid var(--dp-glass-border);
		border-radius: var(--dp-radius-lg, 12px);
		padding: var(--dp-space-4, 1rem);
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-2, 0.5rem);
		box-shadow:
			0 4px 24px var(--dp-glass-shadow),
			inset 0 1px 1px var(--dp-glass-highlight);
		transition: all 0.2s ease;
	}

	.stat-card:hover {
		border-color: var(--dp-glass-border-bright);
		box-shadow:
			0 0 8px oklch(from var(--dp-accent-primary) l c h / 0.15),
			0 6px 28px var(--dp-glass-shadow),
			inset 0 1px 1px var(--dp-glass-highlight);
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

	.card-change.neutral {
		color: var(--dp-text-muted);
		background: oklch(from var(--dp-text-muted) l c h / 0.15);
	}

	.card-sublabel {
		font-size: var(--dp-text-sm, 0.875rem);
		color: var(--dp-text-muted);
	}
</style>
