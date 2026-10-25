<script lang="ts">
	/**
	 * PulseView - Real-time activity feed and system pulse
	 * Shows: Live events, system activity, AI actions, file changes
	 */
	import { statusStore } from '$lib/stores/status.svelte';

	interface PulseEvent {
		id: string;
		type: 'ai' | 'system' | 'user' | 'file';
		message: string;
		timestamp: Date;
	}

	let events = $state<PulseEvent[]>([
		{ id: '1', type: 'system', message: 'DevPulse initialized', timestamp: new Date() },
		{ id: '2', type: 'ai', message: 'Maestro ready for assistance', timestamp: new Date() }
	]);

	function getEventIcon(type: PulseEvent['type']): string {
		switch (type) {
			case 'ai': return '🤖';
			case 'system': return '⚡';
			case 'user': return '👤';
			case 'file': return '📄';
			default: return '•';
		}
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}
</script>

<div class="pulse">
	<header class="pulse-header">
		<h1>Pulse</h1>
		<div class="pulse-indicator" class:active={statusStore.aiReady}>
			<span class="pulse-dot"></span>
			<span>Live</span>
		</div>
	</header>

	<div class="pulse-feed">
		{#each events as event (event.id)}
			<div class="pulse-event glass" data-type={event.type}>
				<span class="event-icon">{getEventIcon(event.type)}</span>
				<div class="event-content">
					<p class="event-message">{event.message}</p>
					<time class="event-time">{formatTime(event.timestamp)}</time>
				</div>
			</div>
		{/each}

		{#if events.length === 0}
			<div class="empty-state glass">
				<p>No activity yet. Start working to see the pulse.</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.pulse {
		height: 100%;
		display: flex;
		flex-direction: column;
		padding: 2rem;
	}

	.pulse-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.pulse-header h1 {
		font-size: 2rem;
		font-weight: 600;
		margin: 0;
	}

	.pulse-indicator {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary);
	}

	.pulse-indicator.active {
		color: #22c55e;
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: currentColor;
	}

	.pulse-indicator.active .pulse-dot {
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
	}

	.pulse-feed {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.pulse-event {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		padding: 1rem 1.25rem;
	}

	.pulse-event[data-type="ai"] {
		border-left: 3px solid #8b5cf6;
	}

	.pulse-event[data-type="system"] {
		border-left: 3px solid #3b82f6;
	}

	.pulse-event[data-type="user"] {
		border-left: 3px solid #22c55e;
	}

	.pulse-event[data-type="file"] {
		border-left: 3px solid #f59e0b;
	}

	.event-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.event-content {
		flex: 1;
		min-width: 0;
	}

	.event-message {
		margin: 0;
		line-height: 1.5;
	}

	.event-time {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.empty-state {
		padding: 3rem;
		text-align: center;
		color: var(--color-text-secondary);
	}
</style>
