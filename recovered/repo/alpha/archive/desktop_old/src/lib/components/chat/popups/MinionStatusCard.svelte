<script lang="ts">
	/**
	 * MinionStatusCard - Show minion worker status in chat
	 * AI can display background worker progress
	 */

	interface MinionState {
		id: string;
		name: string;
		avatar: string;
		state: 'idle' | 'working' | 'success' | 'error' | 'sleeping';
		task?: string;
		progress?: number;
	}

	interface Props {
		minions: MinionState[];
		onClose?: () => void;
	}

	let { minions, onClose }: Props = $props();

	const stateColors: Record<string, string> = {
		idle: 'rgba(255, 255, 255, 0.3)',
		working: '#6366f1',
		success: '#22c55e',
		error: '#ef4444',
		sleeping: 'rgba(255, 255, 255, 0.2)'
	};

	const stateLabels: Record<string, string> = {
		idle: 'Idle',
		working: 'Working',
		success: 'Done',
		error: 'Error',
		sleeping: 'Sleeping'
	};
</script>

<div class="minion-status-card">
	<header class="card-header">
		<h3>Minion Status</h3>
		{#if onClose}
			<button class="close-btn" onclick={onClose} aria-label="Close">×</button>
		{/if}
	</header>

	<div class="minions-grid">
		{#each minions as minion (minion.id)}
			<div class="minion-item" class:working={minion.state === 'working'}>
				<div class="minion-avatar">{minion.avatar}</div>
				<div class="minion-info">
					<span class="minion-name">{minion.name}</span>
					<span class="minion-state" style="color: {stateColors[minion.state]}">
						{stateLabels[minion.state]}
					</span>
					{#if minion.task}
						<span class="minion-task">{minion.task}</span>
					{/if}
				</div>
				{#if minion.state === 'working' && minion.progress !== undefined}
					<div class="minion-progress">
						<div class="progress-bar" style="width: {minion.progress}%"></div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.minion-status-card {
		background: rgba(30, 30, 50, 0.95);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 12px;
		padding: 1rem;
		max-width: 400px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.card-header h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.minions-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	.minion-item {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 10px;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
	}

	.minion-item.working {
		border-color: rgba(99, 102, 241, 0.4);
		background: rgba(99, 102, 241, 0.08);
	}

	.minion-avatar {
		font-size: 2rem;
		line-height: 1;
	}

	.minion-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.minion-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: #fff;
	}

	.minion-state {
		font-size: 0.7rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.minion-task {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.5);
		max-width: 100px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.minion-progress {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background: #6366f1;
		border-radius: 2px;
		transition: width 0.3s ease;
	}
</style>
