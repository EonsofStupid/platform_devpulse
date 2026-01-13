<script lang="ts">
	/**
	 * ConnectionDot - Visual indicator for connection status
	 */
	import type { ConnectionStatus } from '../types';

	interface Props {
		status: ConnectionStatus;
	}

	let { status }: Props = $props();
</script>

<span
	class="connection-dot"
	class:connected={status === 'connected'}
	class:connecting={status === 'connecting'}
	class:error={status === 'error'}
	class:disconnected={status === 'disconnected'}
	title={status}
></span>

<style>
	.connection-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--dp-radius-full);
		background: var(--dp-text-dim);
		transition: all 0.3s ease;
	}

	.connection-dot.connected {
		background: var(--dp-success);
		box-shadow: 0 0 6px oklch(from var(--dp-success) l c h / 0.6);
	}

	.connection-dot.connecting {
		background: var(--dp-warning);
		animation: pulse 1s ease-in-out infinite;
	}

	.connection-dot.error {
		background: var(--dp-error);
		box-shadow: 0 0 6px oklch(from var(--dp-error) l c h / 0.6);
	}

	.connection-dot.disconnected {
		background: var(--dp-text-dim);
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
</style>
