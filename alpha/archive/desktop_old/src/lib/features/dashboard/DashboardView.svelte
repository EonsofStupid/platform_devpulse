<script lang="ts">
	/**
	 * DashboardView - Mission Control
	 * Rich visual dashboard with gauges, graphs, and real-time status
	 * Connects to real backend data via stores
	 */
	import { onMount, onDestroy } from 'svelte';
	import { statusStore } from '$lib/stores/status.svelte';
	import { projectsStore } from '$lib/stores/projects.svelte';
	import { modelsStore } from '$lib/stores/models.svelte';

	// Import visual components
	import StatusIndicator from '$lib/components/ui/StatusIndicator.svelte';
	import GaugeArc from '$lib/components/ui/GaugeArc.svelte';
	import LiveGraph from '$lib/components/ui/LiveGraph.svelte';
	import MinionCard from '$lib/components/ui/MinionCard.svelte';
	import ProjectCard from '$lib/components/ui/ProjectCard.svelte';
	import PulseFeed from '$lib/components/ui/PulseFeed.svelte';

	// Derived data
	const recentProjects = $derived(projectsStore.projects.slice(0, 4));

	// Compute Maestro status from AI readiness
	const maestroStatus = $derived.by(() => {
		if (modelsStore.isLoadingModel) return 'loading';
		if (statusStore.aiReady) return 'active';
		if (modelsStore.loadedVlModelId) return 'active';
		return 'offline';
	});

	// VRAM usage estimation (mock for now, wire to real later)
	let vramUsage = $state(0);
	let contextLoad = $state(0);

	// Network/system activity graph data
	let networkData = $state<number[]>([10, 15, 12, 18, 22, 19, 25, 30, 28, 35]);

	// Pulse feed events (will be wired to signal stream)
	let pulseEvents = $state<Array<{time: string; message: string; type: 'system' | 'ai' | 'user' | 'file'}>>([]);

	// Simulate live updates for demo (replace with real signal subscription)
	let updateInterval: ReturnType<typeof setInterval> | null = null;

	function addPulseEvent(message: string, type: 'system' | 'ai' | 'user' | 'file' = 'system') {
		const now = new Date();
		const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
		pulseEvents = [{ time, message, type }, ...pulseEvents.slice(0, 19)];
	}

	function updateMetrics() {
		// Update VRAM based on loaded model
		if (modelsStore.loadedVlModel) {
			vramUsage = Math.min(100, (modelsStore.loadedVlModel.vram_gb / 12) * 100);
		} else {
			vramUsage = Math.max(0, vramUsage - 5);
		}

		// Simulate context load fluctuation
		contextLoad = Math.min(100, Math.max(20, contextLoad + (Math.random() - 0.5) * 10));

		// Update network graph with new data point
		const newVal = Math.max(10, Math.min(100, networkData[networkData.length - 1] + (Math.random() - 0.5) * 20));
		networkData = [...networkData.slice(1), newVal];
	}

	onMount(async () => {
		// Start status polling
		statusStore.startPolling(5000);
		await modelsStore.init();

		// Initial pulse events
		addPulseEvent('Dashboard initialized', 'system');
		addPulseEvent('Status polling active', 'system');

		// Set initial metrics
		vramUsage = modelsStore.loadedVlModel ? 68 : 0;
		contextLoad = 45;

		// Simulate live updates
		updateInterval = setInterval(() => {
			updateMetrics();
		}, 2000);
	});

	onDestroy(() => {
		statusStore.stopPolling();
		modelsStore.destroy();
		if (updateInterval) clearInterval(updateInterval);
	});

	async function handleLoadModel(modelId: string) {
		addPulseEvent(`Loading model: ${modelId}`, 'ai');
		await modelsStore.loadVlModel(modelId);
		addPulseEvent(`Model loaded successfully`, 'ai');
	}

	async function handleUnloadModel() {
		addPulseEvent('Unloading VL model', 'ai');
		await modelsStore.unloadVlModel();
		addPulseEvent('Model unloaded', 'system');
	}
</script>

<div class="dashboard">
	<!-- Top Bar -->
	<header class="top-bar">
		<StatusIndicator status={maestroStatus} label="Maestro Status" />

		<div class="pulse-header">
			<span class="pulse-icon">📡</span>
			<span class="pulse-text">PULSE FEED</span>
		</div>

		<div class="user-badge">
			<span class="level">Lv.5 Architect</span>
			<span class="xp">XP: 64,500</span>
		</div>
	</header>

	<!-- Main Content Grid -->
	<div class="main-grid">
		<!-- Left Column: Mission Control + Projects -->
		<div class="left-column">
			<!-- Mission Control Section -->
			<section class="mission-control">
				<h2 class="section-title">Mission Control</h2>

				<div class="control-grid">
					<div class="gauge-wrapper">
						<GaugeArc
							value={vramUsage}
							label="VRAM Usage"
							sublabel={modelsStore.loadedVlModel ? `${modelsStore.loadedVlModel.vram_gb.toFixed(1)}/12GB` : '0/12GB'}
							color={vramUsage > 80 ? '#ef4444' : vramUsage > 60 ? '#f59e0b' : '#22c55e'}
						/>
					</div>

					<div class="gauge-wrapper">
						<GaugeArc
							value={contextLoad}
							label="Context Load"
							color={contextLoad > 80 ? '#ef4444' : contextLoad > 60 ? '#f59e0b' : '#06b6d4'}
						/>
					</div>

					<LiveGraph
						data={networkData}
						label="Network Traffic"
						unit=" MB/s"
						color="#06b6d4"
					/>
				</div>

				<!-- Minion Status Row -->
				<div class="minions-row">
					<MinionCard
						task={statusStore.aiReady ? 'Context Assembly' : 'Standby'}
						status={statusStore.aiReady ? 'working' : 'idle'}
						icon="🧠"
					/>
					<MinionCard
						task={modelsStore.isLoadingModel ? 'Loading Model' : 'File Watching'}
						status={modelsStore.isLoadingModel ? 'working' : 'active'}
						icon="👁️"
					/>
					<MinionCard
						task="Idle"
						status="idle"
						icon="📊"
					/>
				</div>
			</section>

			<!-- VL Model Selection -->
			<section class="model-section">
				<div class="section-header">
					<h2 class="section-title">Vision Models</h2>
					<span class="badge badge-accent">VL</span>
				</div>

				{#if modelsStore.loading}
					<div class="model-loading">
						<div class="neural-loader">
							<span></span><span></span><span></span><span></span>
						</div>
						<p>Loading models...</p>
					</div>
				{:else}
					<div class="model-grid">
						{#each modelsStore.vlModels as model (model.id)}
							{@const isLoaded = modelsStore.loadedVlModelId === model.id}
							{@const isLoading = modelsStore.loadingModelId === model.id}
							<button
								class="model-card"
								class:loaded={isLoaded}
								class:loading={isLoading}
								class:unavailable={!model.available}
								onclick={() => model.available ? (isLoaded ? handleUnloadModel() : handleLoadModel(model.id)) : null}
								disabled={!model.available || (modelsStore.isLoadingModel && !isLoading)}
							>
								{#if isLoading}
									<div class="model-loading-overlay">
										<div class="spinner"></div>
										<span>{modelsStore.loadStage || 'Loading...'}</span>
									</div>
								{/if}

								<div class="model-header">
									<span class="model-name">{model.name}</span>
									<span class="model-params">{model.params_b}B</span>
								</div>

								<div class="model-specs">
									<span><strong>{model.vram_gb.toFixed(1)}</strong> GB</span>
									{#if model.quantization}
										<span>{model.quantization}</span>
									{/if}
								</div>

								<div class="model-status">
									{#if isLoaded}
										<span class="status-badge loaded">Loaded</span>
									{:else if !model.available}
										<span class="status-badge missing">Missing</span>
									{:else}
										<span class="status-badge ready">Ready</span>
									{/if}
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</section>

			<!-- Recent Projects -->
			<section class="projects-section">
				<h2 class="section-title">Recent Project Cards</h2>
				<div class="projects-grid">
					{#each recentProjects as project, i}
						<ProjectCard
							name={project.name}
							status="Active"
							progress={75 - i * 15}
							health={i === 0 ? 'good' : i === 1 ? 'warning' : 'good'}
						/>
					{:else}
						<div class="no-projects">
							<p>No projects yet. Add one to get started.</p>
						</div>
					{/each}
				</div>
			</section>
		</div>

		<!-- Right Column: Pulse Feed -->
		<aside class="pulse-sidebar">
			<PulseFeed events={pulseEvents} />

			<!-- Quick Stats -->
			<div class="quick-stats">
				<div class="stat-item">
					<span class="stat-value">{projectsStore.count}</span>
					<span class="stat-label">Projects</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{statusStore.status?.sessions_count ?? 0}</span>
					<span class="stat-label">Sessions</span>
				</div>
				<div class="stat-item">
					<span class="stat-value">{modelsStore.vlModels.filter(m => m.available).length}</span>
					<span class="stat-label">Models</span>
				</div>
			</div>
		</aside>
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		min-height: 100vh;
		background: var(--color-bg-void, #030712);
	}

	/* Top Bar */
	.top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1.25rem;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1rem;
		backdrop-filter: blur(12px);
	}

	.pulse-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.pulse-icon {
		font-size: 1.25rem;
		animation: pulse-glow 2s ease-in-out infinite;
	}

	.pulse-text {
		font-weight: 600;
		font-size: 0.9rem;
		letter-spacing: 0.1em;
		color: #06b6d4;
	}

	.user-badge {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.level {
		font-weight: 600;
		font-size: 0.875rem;
		color: #8b5cf6;
	}

	.xp {
		font-size: 0.75rem;
		color: #f59e0b;
	}

	/* Main Grid */
	.main-grid {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 1.5rem;
		flex: 1;
	}

	.left-column {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Section Title */
	.section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
		margin: 0 0 1rem 0;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.badge {
		font-size: 0.65rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-accent {
		background: rgba(139, 92, 246, 0.2);
		color: #a78bfa;
		border: 1px solid rgba(139, 92, 246, 0.3);
	}

	/* Mission Control */
	.mission-control {
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.control-grid {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 1.5rem;
		align-items: start;
		margin-bottom: 1.25rem;
	}

	.gauge-wrapper {
		display: flex;
		justify-content: center;
	}

	.minions-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.75rem;
	}

	/* Model Section */
	.model-section {
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.model-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.model-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 0.75rem;
	}

	.model-card {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.model-card:hover:not(:disabled) {
		border-color: rgba(139, 92, 246, 0.5);
		box-shadow: 0 0 20px rgba(139, 92, 246, 0.1);
	}

	.model-card.loaded {
		border-color: rgba(34, 197, 94, 0.5);
		box-shadow: 0 0 20px rgba(34, 197, 94, 0.1);
	}

	.model-card.unavailable {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.model-card:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.model-loading-overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 23, 42, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.7);
	}

	.model-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}

	.model-name {
		font-weight: 600;
		color: white;
		font-size: 0.9rem;
	}

	.model-params {
		font-size: 0.7rem;
		color: #8b5cf6;
		font-weight: 500;
	}

	.model-specs {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.model-specs strong {
		color: white;
	}

	.model-status {
		margin-top: auto;
	}

	.status-badge {
		display: inline-block;
		font-size: 0.6rem;
		padding: 0.2rem 0.4rem;
		border-radius: 0.25rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.status-badge.loaded {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.status-badge.ready {
		background: rgba(59, 130, 246, 0.2);
		color: #3b82f6;
	}

	.status-badge.missing {
		background: rgba(245, 158, 11, 0.2);
		color: #f59e0b;
	}

	/* Projects Section */
	.projects-section {
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 1rem;
		padding: 1.25rem;
	}

	.projects-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.no-projects {
		grid-column: 1 / -1;
		text-align: center;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.4);
	}

	/* Pulse Sidebar */
	.pulse-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.quick-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}

	.stat-item {
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.5rem;
		padding: 0.75rem;
		text-align: center;
	}

	.stat-value {
		display: block;
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
	}

	.stat-label {
		font-size: 0.6rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(255, 255, 255, 0.5);
	}

	/* Neural Loader */
	.neural-loader {
		display: flex;
		gap: 4px;
	}

	.neural-loader span {
		width: 8px;
		height: 24px;
		background: #8b5cf6;
		border-radius: 4px;
		animation: neural-bounce 1.4s ease-in-out infinite;
	}

	.neural-loader span:nth-child(1) { animation-delay: 0s; }
	.neural-loader span:nth-child(2) { animation-delay: 0.1s; }
	.neural-loader span:nth-child(3) { animation-delay: 0.2s; }
	.neural-loader span:nth-child(4) { animation-delay: 0.3s; }

	@keyframes neural-bounce {
		0%, 100% { transform: scaleY(0.5); opacity: 0.5; }
		50% { transform: scaleY(1); opacity: 1; }
	}

	/* Spinner */
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(139, 92, 246, 0.3);
		border-top-color: #8b5cf6;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes pulse-glow {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}

	/* Responsive */
	@media (max-width: 1024px) {
		.main-grid {
			grid-template-columns: 1fr;
		}

		.pulse-sidebar {
			order: -1;
		}

		.control-grid {
			grid-template-columns: 1fr 1fr;
		}

		.minions-row {
			grid-template-columns: 1fr;
		}
	}
</style>
