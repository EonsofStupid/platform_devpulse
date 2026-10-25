<script lang="ts">
	/**
	 * MinionCard - Individual minion worker display
	 */

	export type MinionState = 'idle' | 'working' | 'success' | 'error' | 'sleeping';

	interface Props {
		id: string;
		name: string;
		avatar: string;
		role: string;
		state: MinionState;
		task?: string;
		progress?: number;
		stats?: {
			completed_today: number;
			errors_today: number;
		};
	}

	let { id, name, avatar, role, state, task, progress, stats }: Props = $props();

	const stateColors: Record<MinionState, string> = {
		idle: 'rgba(255, 255, 255, 0.3)',
		working: '#6366f1',
		success: '#22c55e',
		error: '#ef4444',
		sleeping: 'rgba(255, 255, 255, 0.15)'
	};

	const stateLabels: Record<MinionState, string> = {
		idle: 'Idle',
		working: 'Working',
		success: 'Complete',
		error: 'Error',
		sleeping: 'Sleeping'
	};
</script>

<div class="minion-card" class:working={state === 'working'} class:error={state === 'error'}>
	<!-- Avatar -->
	<div class="avatar-section">
		<div class="avatar" class:animated={state === 'working'}>
			{avatar}
		</div>
		<span class="status-indicator" style="background: {stateColors[state]}"></span>
	</div>

	<!-- Info -->
	<div class="info-section">
		<span class="minion-name">{name}</span>
		<span class="minion-role">{role}</span>
		<span class="minion-state" style="color: {stateColors[state]}">
			{stateLabels[state]}
		</span>
	</div>

	<!-- Progress (if working) -->
	{#if state === 'working' && progress !== undefined}
		<div class="progress-section">
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progress}%"></div>
			</div>
			{#if task}
				<span class="task-label">{task}</span>
			{/if}
		</div>
	{/if}

	<!-- Stats -->
	{#if stats}
		<div class="stats-section">
			<span class="stat completed">{stats.completed_today} done</span>
			{#if stats.errors_today > 0}
				<span class="stat errors">{stats.errors_today} errors</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.minion-card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 14px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.5rem;
		transition: all 0.2s ease;
		min-width: 120px;
	}

	.minion-card.working {
		border-color: rgba(99, 102, 241, 0.4);
		background: rgba(99, 102, 241, 0.06);
	}

	.minion-card.error {
		border-color: rgba(239, 68, 68, 0.4);
		background: rgba(239, 68, 68, 0.06);
	}

	.avatar-section {
		position: relative;
	}

	.avatar {
		font-size: 2.5rem;
		line-height: 1;
		filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
	}

	.avatar.animated {
		animation: bounce 1s ease-in-out infinite;
	}

	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
		}
	}

	.status-indicator {
		position: absolute;
		bottom: 2px;
		right: -2px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 2px solid rgba(30, 30, 50, 1);
	}

	.info-section {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.minion-name {
		font-size: 0.95rem;
		font-weight: 700;
		color: #fff;
	}

	.minion-role {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.minion-state {
		font-size: 0.75rem;
		font-weight: 600;
		margin-top: 0.25rem;
	}

	.progress-section {
		width: 100%;
		margin-top: 0.5rem;
	}

	.progress-bar {
		height: 5px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 3px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #6366f1;
		border-radius: 3px;
		transition: width 0.3s ease;
	}

	.task-label {
		display: block;
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.35rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100px;
	}

	.stats-section {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.stat {
		font-size: 0.65rem;
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
	}

	.stat.completed {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.stat.errors {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
</style>
