<script lang="ts">
	/**
	 * Pipeline Visualization - Signal flow through storage layers
	 * Shows L1 (Broadcast) → L2 (Cache) → L3 (Durable/Parking) → L4 (RRO) → L6 (DuckDB)
	 */
	import Header from '$lib/components/layout/Header.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';

	interface Layer {
		id: string;
		name: string;
		storage: string;
		status: 'pass' | 'warn' | 'fail' | 'unknown';
		description: string;
		throughput: number;
	}

	const layers: Layer[] = [
		{
			id: 'l1',
			name: 'L1 Broadcast',
			storage: 'tokio::broadcast',
			status: 'pass',
			description: 'Real-time signal distribution to subscribers',
			throughput: 0
		},
		{
			id: 'l2',
			name: 'L2 Cache',
			storage: 'moka',
			status: 'pass',
			description: 'Hot cache for recent signals',
			throughput: 0
		},
		{
			id: 'l3_durable',
			name: 'L3 Durable',
			storage: 'libSQL',
			status: 'pass',
			description: 'Persistent storage for Chat signals',
			throughput: 0
		},
		{
			id: 'l3_parking',
			name: 'L3 Parking',
			storage: 'fjall',
			status: 'pass',
			description: 'Embedded KV store for high-frequency signals',
			throughput: 0
		},
		{
			id: 'l4',
			name: 'L4 Vector',
			storage: 'RRO',
			status: 'unknown',
			description: 'Vector embeddings for semantic search (stub)',
			throughput: 0
		},
		{
			id: 'l6',
			name: 'L6 Analytics',
			storage: 'DuckDB',
			status: 'pass',
			description: 'OLAP queries and aggregations',
			throughput: 0
		}
	];
</script>

<div class="flex flex-col h-full">
	<Header title="Pipeline Visualization" />

	<div class="flex-1 p-6 overflow-auto">
		<div class="info-banner glass">
			<p>
				<strong>Signal Flow:</strong> Signals emit from Engine → SignalRouter (L1) → SignalProcessor
				routes to sinks based on profile → Each layer handles specific persistence needs
			</p>
		</div>

		<!-- Pipeline Flow Diagram -->
		<div class="pipeline-container">
			{#each layers as layer, i (layer.id)}
				<div class="layer-node glass">
					<div class="layer-header">
						<StatusBadge status={layer.status} />
						<h3 class="layer-name">{layer.name}</h3>
					</div>

					<div class="layer-storage">
						<span class="storage-icon">💾</span>
						<span class="storage-name">{layer.storage}</span>
					</div>

					<p class="layer-description">{layer.description}</p>

					<div class="layer-metrics">
						<div class="metric">
							<span class="metric-label">Throughput</span>
							<span class="metric-value">{layer.throughput}/s</span>
						</div>
					</div>
				</div>

				{#if i < layers.length - 1}
					<div class="flow-arrow">
						<div class="arrow-line"></div>
						<div class="arrow-head">→</div>
					</div>
				{/if}
			{/each}
		</div>

		<!-- Signal Profiles -->
		<div class="profiles-section glass">
			<h3 class="section-title">Signal Routing Profiles</h3>
			<div class="profiles-grid">
				<div class="profile-card">
					<h4>HOT (TierA)</h4>
					<p class="profile-desc">
						Inline data like Analytics, System, Inference. Routes to: Broadcast + Cache + DuckDB
					</p>
				</div>
				<div class="profile-card">
					<h4>WARM (TierB)</h4>
					<p class="profile-desc">
						BlobHash like Vision results. Routes to: Broadcast + Cache + Parking
					</p>
				</div>
				<div class="profile-card">
					<h4>COLD (TierC)</h4>
					<p class="profile-desc">
						PathBuf like Audio files. Routes to: Broadcast + Cache + Parking (minimal)
					</p>
				</div>
				<div class="profile-card">
					<h4>CRITICAL</h4>
					<p class="profile-desc">
						Chat messages. Routes to: Broadcast + Cache + libSQL + Vector (when ready)
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.info-banner {
		padding: 1rem 1.5rem;
		margin-bottom: 2rem;
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 1rem;
	}

	.info-banner p {
		color: #a5b4fc;
		font-size: 0.875rem;
		margin: 0;
	}

	.pipeline-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-bottom: 2rem;
		padding: 2rem;
		background: rgba(255, 255, 255, 0.02);
		border-radius: 1rem;
	}

	.layer-node {
		padding: 1.5rem;
		position: relative;
	}

	.layer-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.layer-name {
		font-size: 1.125rem;
		font-weight: 600;
		color: #f1f5f9;
		font-family: 'SF Mono', 'Monaco', monospace;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.layer-storage {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.storage-icon {
		font-size: 1.25rem;
	}

	.storage-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: #06b6d4;
		font-family: 'SF Mono', 'Monaco', monospace;
	}

	.layer-description {
		color: #9ca3af;
		font-size: 0.875rem;
		margin-bottom: 1rem;
	}

	.layer-metrics {
		display: flex;
		gap: 1.5rem;
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.metric-label {
		font-size: 0.75rem;
		color: #6b7280;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.metric-value {
		font-size: 1.125rem;
		font-weight: 600;
		color: #cbd5e1;
		font-family: 'SF Mono', 'Monaco', monospace;
	}

	.flow-arrow {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.5rem 0;
	}

	.arrow-line {
		width: 2px;
		height: 20px;
		background: linear-gradient(180deg, #6366f1, #a855f7);
	}

	.arrow-head {
		font-size: 1.5rem;
		color: #a855f7;
		margin-top: -0.5rem;
	}

	.profiles-section {
		padding: 2rem;
	}

	.section-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
		color: #f1f5f9;
	}

	.profiles-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.profile-card {
		padding: 1.5rem;
		background: rgba(255, 255, 255, 0.02);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 0.75rem;
	}

	.profile-card h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: #6366f1;
		margin-bottom: 0.5rem;
		font-family: 'SF Mono', 'Monaco', monospace;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.profile-desc {
		color: #9ca3af;
		font-size: 0.8125rem;
		line-height: 1.5;
		margin: 0;
	}

	.glass {
		background: rgba(17, 24, 39, 0.8);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
	}
</style>
