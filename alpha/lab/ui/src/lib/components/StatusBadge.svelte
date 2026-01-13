<script lang="ts">
	/**
	 * StatusBadge - Reusable status indicator component
	 * 
	 * Shows colored badge with icon for pass/warn/fail/unknown states
	 */
	interface Props {
		status: 'pass' | 'warn' | 'fail' | 'unknown';
		label?: string;
		icon?: string;
	}

	let { status, label, icon }: Props = $props();

	function getDefaultIcon(status: string): string {
		switch (status) {
			case 'pass':
				return '✓';
			case 'warn':
				return '⚠';
			case 'fail':
				return '✗';
			default:
				return '?';
		}
	}

	const displayIcon = $derived(icon || getDefaultIcon(status));
</script>

<span class={`status-badge status-${status}`}>
	<span class="badge-icon">{displayIcon}</span>
	{#if label}
		<span class="badge-label">{label}</span>
	{/if}
</span>

<style>
	.status-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-icon {
		font-size: 1rem;
		font-weight: 700;
	}

	.status-pass {
		background: rgba(34, 197, 94, 0.1);
		color: #22c55e;
		border: 1px solid rgba(34, 197, 94, 0.3);
	}

	.status-warn {
		background: rgba(251, 146, 60, 0.1);
		color: #fb923c;
		border: 1px solid rgba(251, 146, 60, 0.3);
	}

	.status-fail {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.status-unknown {
		background: rgba(107, 114, 128, 0.1);
		color: #6b7280;
		border: 1px solid rgba(107, 114, 128, 0.3);
	}
</style>
