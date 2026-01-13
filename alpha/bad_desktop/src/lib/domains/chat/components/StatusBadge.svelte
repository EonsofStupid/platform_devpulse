<script lang="ts">
	/**
	 * StatusBadge - Shows ready/thinking status
	 */
	interface Props {
		status: 'ready' | 'thinking';
		label?: string;
	}

	let { status, label }: Props = $props();

	let displayLabel = $derived(status === 'thinking' ? label ?? 'Thinking...' : 'Ready');
</script>

<span class="status-badge" class:status-ready={status === 'ready'} class:status-thinking={status === 'thinking'}>
	{displayLabel}
</span>

<style>
	.status-badge {
		font-size: 0.5625rem;
		padding: 0.125rem var(--dp-space-2);
		border-radius: var(--dp-radius-full);
		font-weight: 500;
		text-transform: uppercase;
	}

	.status-ready {
		background: oklch(from var(--dp-success) l c h / 0.2);
		color: var(--dp-success);
	}

	.status-thinking {
		background: oklch(from var(--dp-accent-primary) l c h / 0.3);
		color: var(--dp-text-primary);
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
</style>
