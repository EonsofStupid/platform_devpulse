<script lang="ts">
	/**
	 * Sub-Agents Status Dashboard
	 * Shows status of ENFORCER, GUARDIAN, VISION and other minions
	 */
	import Header from '$lib/components/layout/Header.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	interface AgentStatus {
		id: string;
		name: string;
		status: 'pass' | 'warn' | 'fail' | 'unknown';
		description: string;
		enabled: boolean;
	}

	// Scaffolded agent data
	const agents: AgentStatus[] = [
		{
			id: 'enforcer',
			name: 'ENFORCER',
			status: 'unknown',
			description: 'Budget and resource constraint enforcement',
			enabled: false
		},
		{
			id: 'guardian',
			name: 'GUARDIAN',
			status: 'unknown',
			description: 'File system watching and change detection',
			enabled: false
		},
		{
			id: 'vision',
			name: 'VISION',
			status: 'unknown',
			description: 'SIGLIPv2 naFlex visual understanding',
			enabled: false
		},
		{
			id: 'diary',
			name: 'DIARY',
			status: 'unknown',
			description: 'Session continuity and context management',
			enabled: false
		},
		{
			id: 'psych',
			name: 'PSYCH',
			status: 'unknown',
			description: 'User state detection and adaptation',
			enabled: false
		},
		{
			id: 'teacher',
			name: 'TEACHER',
			status: 'unknown',
			description: 'Learning pattern analysis',
			enabled: false
		},
		{
			id: 'scribe',
			name: 'SCRIBE',
			status: 'unknown',
			description: 'Translation and documentation',
			enabled: false
		},
		{
			id: 'researcher',
			name: 'RESEARCHER',
			status: 'unknown',
			description: 'Information gathering and synthesis',
			enabled: false
		}
	];
</script>

<div class="flex flex-col h-full">
	<Header title="Sub-Agent Status" />

	<div class="flex-1 p-6 overflow-auto">
		<div class="info-banner glass">
			<p>
				<strong>Implementation Status:</strong> Sub-agents are scaffolded but not fully implemented.
				Only ENFORCER, GUARDIAN, and VISION are priority for Sprint 1.
			</p>
		</div>

		<div class="agents-grid">
			{#each agents as agent (agent.id)}
				<div class="agent-card glass">
					<div class="agent-header">
						<h3 class="agent-name">{agent.name}</h3>
						<StatusBadge status={agent.status} label={agent.enabled ? 'ENABLED' : 'DISABLED'} />
					</div>

					<p class="agent-description">{agent.description}</p>

					<div class="agent-metrics">
						<div class="metric">
							<span class="metric-label">Status</span>
							<span class="metric-value">Not Implemented</span>
						</div>
						<div class="metric">
							<span class="metric-label">Uptime</span>
							<span class="metric-value">—</span>
						</div>
						<div class="metric">
							<span class="metric-label">Events</span>
							<span class="metric-value">0</span>
						</div>
					</div>

					<div class="agent-actions">
						<button class="btn-secondary" disabled>Configure</button>
						<button class="btn-secondary" disabled>
							{agent.enabled ? 'Disable' : 'Enable'}
						</button>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.info-banner {
		padding: 1rem 1.5rem;
		margin-bottom: 2rem;
		background: rgba(251, 146, 60, 0.1);
		border-color: rgba(251, 146, 60, 0.3);
	}

	.info-banner p {
		color: #fb923c;
		font-size: 0.875rem;
		margin: 0;
	}

	.agents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 1.5rem;
	}

	.agent-card {
		padding: 1.5rem;
	}

	.agent-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.agent-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: #f1f5f9;
		font-family: 'SF Mono', 'Monaco', monospace;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.agent-description {
		color: #9ca3af;
		font-size: 0.875rem;
		margin-bottom: 1.5rem;
		line-height: 1.5;
	}

	.agent-metrics {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 0.5rem;
	}

	.metric {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.metric-label {
		font-size: 0.8125rem;
		color: #6b7280;
	}

	.metric-value {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #cbd5e1;
		font-family: 'SF Mono', 'Monaco', monospace;
	}

	.agent-actions {
		display: flex;
		gap: 0.75rem;
	}

	.btn-secondary {
		flex: 1;
		padding: 0.625rem 1.25rem;
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 0.5rem;
		color: #a5b4fc;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-secondary:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.2);
		border-color: rgba(99, 102, 241, 0.5);
	}

	.btn-secondary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.glass {
		background: rgba(17, 24, 39, 0.8);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
	}
</style>
