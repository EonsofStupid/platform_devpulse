<script lang="ts">
	/**
	 * ConnectionIndicator - Reusable status indicator
	 * Shows connection state with pulsing dot and label
	 *
	 * States:
	 * - offline: gray, no pulse
	 * - connecting: cyan, slow pulse
	 * - connected: green, subtle pulse
	 * - error: red, fast pulse
	 * - idle: dim cyan, no pulse
	 */
	import type { ConnectionState } from '$lib/types/connections';

	interface Props {
		state: ConnectionState;
		label: string;
		detail?: string;
		compact?: boolean; // Smaller variant for toolbar
		showLabel?: boolean;
	}

	let {
		state,
		label,
		detail,
		compact = false,
		showLabel = true
	}: Props = $props();

	// Map state to CSS class
	const stateClass = $derived(state);

	// Tooltip text
	const tooltip = $derived(
		detail ? `${label}: ${detail}` : `${label}: ${state}`
	);
</script>

<div
	class="connection-indicator"
	class:compact
	class:offline={state === 'offline'}
	class:connecting={state === 'connecting'}
	class:connected={state === 'connected'}
	class:error={state === 'error'}
	class:idle={state === 'idle'}
	title={tooltip}
>
	<span class="status-dot">
		<span class="dot-core"></span>
		{#if state === 'connecting' || state === 'connected' || state === 'error'}
			<span class="dot-pulse"></span>
		{/if}
	</span>

	{#if showLabel}
		<span class="status-label">{label}</span>
	{/if}

	{#if detail && !compact}
		<span class="status-detail">{detail}</span>
	{/if}
</div>

<style>
	.connection-indicator {
		display: inline-flex;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-1, 0.25rem) var(--dp-space-2, 0.5rem);
		background: oklch(0% 0 0 / 0.2);
		border: 1px solid var(--dp-glass-border);
		border-radius: var(--dp-radius, 8px);
		font-size: var(--dp-text-xs, 0.75rem);
		white-space: nowrap;
	}

	.connection-indicator.compact {
		padding: 2px 6px;
		gap: 4px;
		font-size: 0.625rem;
	}

	/* Status Dot */
	.status-dot {
		position: relative;
		width: 10px;
		height: 10px;
		flex-shrink: 0;
	}

	.compact .status-dot {
		width: 8px;
		height: 8px;
	}

	.dot-core {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: currentColor;
		transition: background 0.2s ease;
	}

	.dot-pulse {
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0;
		animation: pulse-ring 2s ease-out infinite;
	}

	/* State Colors */
	.offline {
		color: var(--dp-text-dim);
	}

	.offline .dot-core {
		background: var(--dp-text-dim);
	}

	.connecting {
		color: var(--dp-accent-primary);
	}

	.connecting .dot-core {
		background: var(--dp-accent-primary);
	}

	.connecting .dot-pulse {
		animation-duration: 1.5s;
	}

	.connected {
		color: var(--dp-success);
	}

	.connected .dot-core {
		background: var(--dp-success);
		box-shadow: 0 0 8px var(--dp-success);
	}

	.connected .dot-pulse {
		animation-duration: 3s;
	}

	.error {
		color: var(--dp-error);
	}

	.error .dot-core {
		background: var(--dp-error);
		box-shadow: 0 0 8px var(--dp-error);
	}

	.error .dot-pulse {
		animation-duration: 0.8s;
	}

	.idle {
		color: var(--dp-text-muted);
	}

	.idle .dot-core {
		background: var(--dp-accent-primary);
		opacity: 0.5;
	}

	/* Labels */
	.status-label {
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.status-detail {
		color: var(--dp-text-muted);
		font-family: var(--dp-font-mono, monospace);
	}

	/* Hover */
	.connection-indicator:hover {
		border-color: var(--dp-glass-border-bright);
	}

	/* Pulse animation */
	@keyframes pulse-ring {
		0% {
			transform: scale(0.8);
			opacity: 0.6;
		}
		100% {
			transform: scale(1.8);
			opacity: 0;
		}
	}
</style>
