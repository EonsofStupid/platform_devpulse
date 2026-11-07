<script lang="ts">
	/**
	 * MinionPanel - Display all minion workers
	 *
	 * Minions:
	 * - Chunky: Indexing/chunking
	 * - Ember: Embedding generation
	 * - Hoppy: Search/retrieval
	 * - Sage: Reranking
	 */
	import MinionCard, { type MinionState } from './MinionCard.svelte';

	interface Minion {
		id: string;
		name: string;
		avatar: string;
		role: string;
		state: MinionState;
		task?: string;
		progress?: number;
		stats: {
			completed_today: number;
			errors_today: number;
		};
	}

	// Minion definitions
	let minions = $state<Minion[]>([
		{
			id: 'chunky',
			name: 'Chunky',
			avatar: '🦛',
			role: 'Indexing',
			state: 'working',
			task: '1.2k/3k chunks',
			progress: 40,
			stats: { completed_today: 15, errors_today: 0 }
		},
		{
			id: 'ember',
			name: 'Ember',
			avatar: '🦊',
			role: 'Embedding',
			state: 'idle',
			stats: { completed_today: 1247, errors_today: 2 }
		},
		{
			id: 'hoppy',
			name: 'Hoppy',
			avatar: '🐸',
			role: 'Retrieval',
			state: 'idle',
			stats: { completed_today: 89, errors_today: 0 }
		},
		{
			id: 'sage',
			name: 'Sage',
			avatar: '🦉',
			role: 'Reranking',
			state: 'idle',
			stats: { completed_today: 45, errors_today: 0 }
		}
	]);

	// Summary stats
	let activeTasks = $derived(minions.filter((m) => m.state === 'working').length);
	let completedToday = $derived(minions.reduce((sum, m) => sum + m.stats.completed_today, 0));
</script>

<div class="minion-panel">
	<header class="panel-header">
		<h2>MINIONS</h2>
		<div class="header-stats">
			<span class="stat active">{activeTasks} active</span>
			<span class="stat completed">{completedToday} today</span>
		</div>
	</header>

	<div class="minions-grid">
		{#each minions as minion (minion.id)}
			<MinionCard
				id={minion.id}
				name={minion.name}
				avatar={minion.avatar}
				role={minion.role}
				state={minion.state}
				task={minion.task}
				progress={minion.progress}
				stats={minion.stats}
			/>
		{/each}
	</div>

	<footer class="panel-footer">
		<span class="queue-info">Queue: 0 pending</span>
	</footer>
</div>

<style>
	.minion-panel {
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 16px;
		padding: 1.25rem;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.panel-header h2 {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: rgba(255, 255, 255, 0.6);
	}

	.header-stats {
		display: flex;
		gap: 0.75rem;
	}

	.stat {
		font-size: 0.7rem;
		font-weight: 500;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
	}

	.stat.active {
		background: rgba(99, 102, 241, 0.15);
		color: #818cf8;
	}

	.stat.completed {
		background: rgba(34, 197, 94, 0.15);
		color: #22c55e;
	}

	.minions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 1rem;
	}

	.panel-footer {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		text-align: center;
	}

	.queue-info {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
	}
</style>
