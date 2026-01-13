<script lang="ts">
	/**
	 * DashboardView - Mission Control
	 * Rich visual dashboard with gauges, graphs, and real-time status
	 * Connects to real backend data via stores
	 *
	 * Technical First: Shows raw technical data for development
	 * Later: Layman facade will wrap these components
	 */
	import { onMount, onDestroy } from "svelte";
	import { statusStore } from "$lib/stores/status.svelte";
	import { projectsStore } from "$lib/stores/projects.svelte";
	import { modelsStore } from "$lib/stores/models.svelte";
	import { connectionsStore } from "$lib/stores/connections.svelte";

	// Import visual components
	import {
		StatusIndicator,
		GaugeArc,
		LiveGraph,
		MinionCard,
		ProjectCard,
		PulseFeed,
	} from "$lib/shared/ui";

	// Dashboard Cards
	import {
		SessionCard,
		ContextCard,
		SignalsCard,
		TerminalCard,
	} from "$lib/domains/dashboard";

	// Derived data
	const recentProjects = $derived(projectsStore.projects.slice(0, 4));

	// Get session metrics from connections store
	const sessionMetrics = $derived(connectionsStore.sessionMetrics);
	const activeContext = $derived(connectionsStore.activeContext);
	const activeSignals = $derived(connectionsStore.activeSignals);
	const latestError = $derived(connectionsStore.latestError);

	// Compute Maestro status from AI readiness
	const maestroStatus = $derived.by(() => {
		if (modelsStore.isLoadingModel) return "loading";
		if (statusStore.aiReady) return "active";
		if (modelsStore.loadedVlModelId) return "active";
		return "offline";
	});

	// Dashboard view tabs
	type DashboardTab = "overview" | "cortex" | "systems" | "signals";
	let activeTab = $state<DashboardTab>("overview");

	const dashboardTabs: { id: DashboardTab; label: string; icon: string }[] = [
		{ id: "overview", label: "Overview", icon: "📊" },
		{ id: "cortex", label: "Cortex", icon: "🧠" },
		{ id: "systems", label: "Systems", icon: "⚡" },
		{ id: "signals", label: "Signals", icon: "📡" },
	];

	// VRAM usage estimation (mock for now, wire to real later)
	let vramUsage = $state(0);
	let contextLoad = $state(0);

	// Additional graph data for different views
	let cpuData = $state<number[]>([30, 35, 32, 40, 38, 45, 42, 50, 48, 55]);
	let memoryData = $state<number[]>([60, 62, 58, 65, 63, 68, 70, 72, 69, 75]);
	let inferenceData = $state<number[]>([0, 0, 15, 45, 80, 95, 60, 20, 5, 0]);

	// Network/system activity graph data
	let networkData = $state<number[]>([
		10, 15, 12, 18, 22, 19, 25, 30, 28, 35,
	]);

	// Pulse feed events (will be wired to signal stream)
	let pulseEvents = $state<
		Array<{
			time: string;
			message: string;
			type: "system" | "ai" | "user" | "file";
		}>
	>([]);

	// Simulate live updates for demo (replace with real signal subscription)
	let updateInterval: ReturnType<typeof setInterval> | null = null;

	function addPulseEvent(
		message: string,
		type: "system" | "ai" | "user" | "file" = "system",
	) {
		const now = new Date();
		const time = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
		pulseEvents = [{ time, message, type }, ...pulseEvents.slice(0, 19)];
	}

	function updateMetrics() {
		// Update VRAM based on loaded model
		if (modelsStore.loadedVlModel) {
			vramUsage = Math.min(
				100,
				(modelsStore.loadedVlModel.vram_gb / 12) * 100,
			);
		} else {
			vramUsage = Math.max(0, vramUsage - 5);
		}

		// Simulate context load fluctuation
		contextLoad = Math.min(
			100,
			Math.max(20, contextLoad + (Math.random() - 0.5) * 10),
		);

		// Update all graph data
		const newNetwork = Math.max(
			10,
			Math.min(
				100,
				networkData[networkData.length - 1] +
					(Math.random() - 0.5) * 20,
			),
		);
		networkData = [...networkData.slice(1), newNetwork];

		const newCpu = Math.max(
			20,
			Math.min(
				80,
				cpuData[cpuData.length - 1] + (Math.random() - 0.5) * 15,
			),
		);
		cpuData = [...cpuData.slice(1), newCpu];

		const newMemory = Math.max(
			50,
			Math.min(
				90,
				memoryData[memoryData.length - 1] + (Math.random() - 0.5) * 8,
			),
		);
		memoryData = [...memoryData.slice(1), newMemory];

		// Inference spikes randomly (simulates AI activity)
		const spike =
			Math.random() > 0.7
				? Math.random() * 100
				: Math.max(0, inferenceData[inferenceData.length - 1] - 15);
		inferenceData = [...inferenceData.slice(1), spike];
	}

	onMount(async () => {
		// Start status polling
		statusStore.startPolling(5000);
		await modelsStore.init();

		// Initialize connections store (sets up event listeners)
		await connectionsStore.init();

		// Initial pulse events
		addPulseEvent("Dashboard initialized", "system");
		addPulseEvent("Status polling active", "system");

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
		connectionsStore.destroy();
		if (updateInterval) clearInterval(updateInterval);
	});

	async function handleLoadModel(modelId: string) {
		addPulseEvent(`Loading model: ${modelId}`, "ai");
		await modelsStore.loadVlModel(modelId);
		addPulseEvent(`Model loaded successfully`, "ai");
	}

	async function handleUnloadModel() {
		addPulseEvent("Unloading VL model", "ai");
		await modelsStore.unloadVlModel();
		addPulseEvent("Model unloaded", "system");
	}
</script>

<div class="dashboard">
	<!-- Cyber Tab Bar -->
	<nav class="cyber-tabs">
		{#each dashboardTabs as tab}
			<button
				class="cyber-tab"
				class:active={activeTab === tab.id}
				onclick={() => (activeTab = tab.id)}
			>
				<span class="tab-icon">{tab.icon}</span>
				<span class="tab-label">{tab.label}</span>
				<span class="tab-glow"></span>
			</button>
		{/each}

		<div class="tab-spacer"></div>

		<div class="status-cluster">
			<StatusIndicator status={maestroStatus} label="Maestro" />
		</div>
	</nav>

	<!-- Session Stats Row (always visible) -->
	<SessionCard metrics={sessionMetrics} />

	<!-- Tab Content -->
	<div class="tab-content">
		<!-- ============================================ -->
		<!-- OVERVIEW TAB - Quick glance at everything -->
		<!-- ============================================ -->
		{#if activeTab === "overview"}
			<div class="main-grid">
				<div class="left-column">
					<!-- Context & Signals Row -->
					<div class="context-signals-row">
						<ContextCard
							contextName={activeContext.ide}
							currentFile={activeContext.file}
							line={activeContext.line}
							repository={activeContext.repository}
							mood={activeContext.mood}
							tracking={activeContext.tracking}
						/>
						<SignalsCard
							signals={activeSignals}
							keystrokesPerMin={sessionMetrics.keystrokesPerMin}
							errorsToday={sessionMetrics.errorsToday}
						/>
					</div>

					<!-- Terminal Output (if error present) -->
					{#if latestError}
						<TerminalCard
							entry={latestError}
							onAskGus={(content) =>
								console.log("Ask Gus:", content)}
						/>
					{/if}

					<!-- Quick Gauges -->
					<section class="quick-gauges">
						<div class="gauge-wrapper">
							<GaugeArc
								value={vramUsage}
								label="VRAM"
								sublabel={modelsStore.loadedVlModel
									? `${modelsStore.loadedVlModel.vram_gb.toFixed(1)}GB`
									: "0GB"}
								color={vramUsage > 80
									? "var(--dp-error)"
									: vramUsage > 60
										? "var(--dp-warning)"
										: "var(--dp-success)"}
							/>
						</div>
						<div class="gauge-wrapper">
							<GaugeArc
								value={contextLoad}
								label="Context"
								color={contextLoad > 80
									? "var(--dp-error)"
									: "var(--dp-accent-primary)"}
							/>
						</div>
						<LiveGraph
							data={networkData}
							label="Network"
							unit=" MB/s"
							color="var(--dp-accent-primary)"
						/>
					</section>
				</div>

				<!-- Right Column: Pulse Feed -->
				<aside class="pulse-sidebar">
					<PulseFeed events={pulseEvents} />
				</aside>
			</div>

			<!-- ============================================ -->
			<!-- CORTEX TAB - Llm/AI systems -->
			<!-- ============================================ -->
		{:else if activeTab === "cortex"}
			<div class="cortex-view">
				<div class="cortex-header">
					<h2 class="neon-title">CORTEX NEURAL MATRIX</h2>
					<span
						class="cortex-status"
						class:online={statusStore.aiReady}
					>
						{statusStore.aiReady ? "◉ ONLINE" : "○ STANDBY"}
					</span>
				</div>

				<!-- Inference Activity Graph -->
				<section class="neural-monitor">
					<div class="monitor-label">INFERENCE ACTIVITY</div>
					<LiveGraph
						data={inferenceData}
						label=""
						unit="%"
						color="var(--dp-accent-purple, oklch(65% 0.2 280))"
					/>
				</section>

				<!-- Llm Minions -->
				<div class="cortex-minions">
					<MinionCard
						task={statusStore.aiReady ? "Reasoning" : "Standby"}
						status={statusStore.aiReady ? "working" : "idle"}
						icon="🧠"
					/>
					<MinionCard
						task={modelsStore.isLoadingModel
							? "Loading"
							: "Embedding"}
						status={modelsStore.isLoadingModel
							? "working"
							: "active"}
						icon="🔮"
					/>
					<MinionCard
						task="Memory Indexing"
						status="active"
						icon="💾"
					/>
				</div>

				<!-- VL Model Selection -->
				<section class="model-section">
					<div class="section-header">
						<h2 class="section-title">Vision Models</h2>
						<span class="badge badge-accent">VL</span>
					</div>

					{#if modelsStore.loading}
						<div class="model-loading">
							<div class="neural-loader">
								<span></span><span></span><span></span><span
								></span>
							</div>
							<p>Loading models...</p>
						</div>
					{:else}
						<div class="model-grid">
							{#each modelsStore.vlModels as model (model.id)}
								{@const isLoaded =
									modelsStore.loadedVlModelId === model.id}
								{@const isLoading =
									modelsStore.loadingModelId === model.id}
								<button
									class="model-card"
									class:loaded={isLoaded}
									class:loading={isLoading}
									class:unavailable={!model.available}
									onclick={() =>
										model.available
											? isLoaded
												? handleUnloadModel()
												: handleLoadModel(model.id)
											: null}
									disabled={!model.available ||
										(modelsStore.isLoadingModel &&
											!isLoading)}
								>
									{#if isLoading}
										<div class="model-loading-overlay">
											<div class="spinner"></div>
											<span
												>{modelsStore.loadStage ||
													"Loading..."}</span
											>
										</div>
									{/if}
									<div class="model-header">
										<span class="model-name"
											>{model.name}</span
										>
										<span class="model-params"
											>{model.params_b}B</span
										>
									</div>
									<div class="model-specs">
										<span
											><strong
												>{model.vram_gb.toFixed(
													1,
												)}</strong
											> GB</span
										>
										{#if model.quantization}
											<span>{model.quantization}</span>
										{/if}
									</div>
									<div class="model-status">
										{#if isLoaded}
											<span class="status-badge loaded"
												>Loaded</span
											>
										{:else if !model.available}
											<span class="status-badge missing"
												>Missing</span
											>
										{:else}
											<span class="status-badge ready"
												>Ready</span
											>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</section>
			</div>

			<!-- ============================================ -->
			<!-- SYSTEMS TAB - Hardware/Performance -->
			<!-- ============================================ -->
		{:else if activeTab === "systems"}
			<div class="systems-view">
				<div class="systems-header">
					<h2 class="neon-title">SYSTEM DIAGNOSTICS</h2>
				</div>

				<!-- Multi-Graph Grid -->
				<div class="systems-graphs">
					<div class="graph-panel">
						<LiveGraph
							data={cpuData}
							label="CPU Usage"
							unit="%"
							color="var(--dp-success)"
						/>
					</div>
					<div class="graph-panel">
						<LiveGraph
							data={memoryData}
							label="Memory"
							unit="%"
							color="var(--dp-warning)"
						/>
					</div>
					<div class="graph-panel">
						<LiveGraph
							data={networkData}
							label="Network I/O"
							unit=" MB/s"
							color="var(--dp-accent-primary)"
						/>
					</div>
					<div class="graph-panel">
						<LiveGraph
							data={inferenceData}
							label="GPU Inference"
							unit="%"
							color="var(--dp-accent-purple, oklch(65% 0.2 280))"
						/>
					</div>
				</div>

				<!-- Gauge Row -->
				<div class="systems-gauges">
					<div class="gauge-wrapper">
						<GaugeArc
							value={vramUsage}
							label="VRAM"
							color="var(--dp-success)"
						/>
					</div>
					<div class="gauge-wrapper">
						<GaugeArc
							value={contextLoad}
							label="Context"
							color="var(--dp-accent-primary)"
						/>
					</div>
					<div class="gauge-wrapper">
						<GaugeArc
							value={Math.round(cpuData[cpuData.length - 1])}
							label="CPU"
							color="var(--dp-warning)"
						/>
					</div>
					<div class="gauge-wrapper">
						<GaugeArc
							value={Math.round(
								memoryData[memoryData.length - 1],
							)}
							label="RAM"
							color="var(--dp-error)"
						/>
					</div>
				</div>
			</div>

			<!-- ============================================ -->
			<!-- SIGNALS TAB - Activity/Events -->
			<!-- ============================================ -->
		{:else if activeTab === "signals"}
			<div class="signals-view">
				<div class="signals-header">
					<h2 class="neon-title">SIGNAL STREAM</h2>
					<span class="signal-count"
						>{activeSignals.length} ACTIVE</span
					>
				</div>

				<div class="signals-grid">
					<!-- Left: Live Signals -->
					<div class="signal-monitor">
						<SignalsCard
							signals={activeSignals}
							keystrokesPerMin={sessionMetrics.keystrokesPerMin}
							errorsToday={sessionMetrics.errorsToday}
						/>
						{#if latestError}
							<TerminalCard
								entry={latestError}
								onAskGus={(content) =>
									console.log("Ask Gus:", content)}
							/>
						{/if}
					</div>

					<!-- Right: Pulse Feed -->
					<div class="pulse-monitor">
						<PulseFeed events={pulseEvents} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0;
		min-height: 100%;
	}

	/* ============================================ */
	/* CYBER TABS - Mad Scientist Style */
	/* ============================================ */
	.cyber-tabs {
		display: flex;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-2, 0.5rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark),
			0 4px 24px var(--dp-glass-shadow);
	}

	.cyber-tab {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--dp-space-2, 0.5rem);
		padding: var(--dp-space-2, 0.5rem) var(--dp-space-4, 1rem);
		background: transparent;
		border: 2px solid transparent;
		border-radius: var(--dp-radius, 8px);
		color: var(--dp-text-muted);
		font-size: var(--dp-text-sm, 0.875rem);
		font-weight: var(--dp-font-medium, 500);
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.cyber-tab:hover {
		color: var(--dp-text-primary);
		background: oklch(from var(--dp-accent-primary) l c h / 0.1);
	}

	.cyber-tab.active {
		color: var(--dp-text-primary);
		background: linear-gradient(
			135deg,
			oklch(from var(--dp-accent-primary) l c h / 0.25) 0%,
			oklch(from var(--dp-accent-primary) calc(l - 0.1) c h / 0.15) 100%
		);
		border-color: var(--dp-accent-primary);
		box-shadow:
			0 0 20px oklch(from var(--dp-accent-primary) l c h / 0.3),
			inset 0 1px 1px var(--dp-bevel-light);
	}

	.cyber-tab .tab-icon {
		font-size: 1.1rem;
	}

	.cyber-tab .tab-label {
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.cyber-tab .tab-glow {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			circle at center,
			oklch(from var(--dp-accent-primary) l c h / 0.15) 0%,
			transparent 70%
		);
		opacity: 0;
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.cyber-tab.active .tab-glow {
		opacity: 1;
		animation: tab-pulse 2s ease-in-out infinite;
	}

	@keyframes tab-pulse {
		0%,
		100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.tab-spacer {
		flex: 1;
	}

	.status-cluster {
		display: flex;
		align-items: center;
		gap: var(--dp-space-3, 0.75rem);
		padding-left: var(--dp-space-3, 0.75rem);
		border-left: 2px solid var(--dp-glass-border);
	}

	/* ============================================ */
	/* TAB CONTENT AREA */
	/* ============================================ */
	.tab-content {
		flex: 1;
		min-height: 0;
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

	/* Context & Signals Row */
	.context-signals-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--dp-space-4, 1rem);
	}

	@media (max-width: 900px) {
		.context-signals-row {
			grid-template-columns: 1fr;
		}
	}

	/* Section Title */
	.section-title {
		font-size: 1.125rem;
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-primary);
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
		border-radius: var(--dp-radius-sm, 4px);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.badge-accent {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		color: var(--dp-accent-primary);
		border: 1px solid oklch(from var(--dp-accent-primary) l c h / 0.3);
	}

	.gauge-wrapper {
		display: flex;
		justify-content: center;
	}

	/* Model Section */
	.model-section {
		background: var(--dp-glass-bg);
		border: 2px solid var(--dp-glass-border);
		border-radius: var(--dp-radius-lg, 12px);
		padding: 1.25rem;
		backdrop-filter: blur(16px) saturate(180%);
		-webkit-backdrop-filter: blur(16px) saturate(180%);
		box-shadow: 0 4px 24px var(--dp-glass-shadow);
	}

	.model-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 2rem;
		color: var(--dp-text-muted);
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
		background: var(--dp-glass-inset-bg);
		border: 2px solid oklch(55% 0.12 var(--glass-hue-indigo, 250) / 0.3);
		border-radius: var(--dp-radius, 8px);
		text-align: left;
		cursor: pointer;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.model-card:hover:not(:disabled) {
		border-color: var(--dp-accent-primary);
		box-shadow: var(--dp-glow-sm);
	}

	.model-card.loaded {
		border-color: var(--dp-success);
		box-shadow: 0 0 20px oklch(from var(--dp-success) l c h / 0.2);
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
		color: var(--dp-text-primary);
		font-size: 0.9rem;
	}

	.model-params {
		font-size: 0.7rem;
		color: var(--dp-accent-primary);
		font-weight: 500;
	}

	.model-specs {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
		color: var(--dp-text-muted);
	}

	.model-specs strong {
		color: var(--dp-text-primary);
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
		background: oklch(from var(--dp-success) l c h / 0.2);
		color: var(--dp-success);
	}

	.status-badge.ready {
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		color: var(--dp-accent-primary);
	}

	.status-badge.missing {
		background: oklch(from var(--dp-warning) l c h / 0.2);
		color: var(--dp-warning);
	}

	/* Pulse Sidebar */
	.pulse-sidebar {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* Neural Loader */
	.neural-loader {
		display: flex;
		gap: 4px;
	}

	.neural-loader span {
		width: 8px;
		height: 24px;
		background: var(--dp-accent-primary);
		border-radius: 4px;
		animation: neural-bounce 1.4s ease-in-out infinite;
	}

	.neural-loader span:nth-child(1) {
		animation-delay: 0s;
	}
	.neural-loader span:nth-child(2) {
		animation-delay: 0.1s;
	}
	.neural-loader span:nth-child(3) {
		animation-delay: 0.2s;
	}
	.neural-loader span:nth-child(4) {
		animation-delay: 0.3s;
	}

	@keyframes neural-bounce {
		0%,
		100% {
			transform: scaleY(0.5);
			opacity: 0.5;
		}
		50% {
			transform: scaleY(1);
			opacity: 1;
		}
	}

	/* Spinner */
	.spinner {
		width: 20px;
		height: 20px;
		border: 2px solid oklch(from var(--dp-accent-primary) l c h / 0.3);
		border-top-color: var(--dp-accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse-glow {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* ============================================ */
	/* QUICK GAUGES (Overview) */
	/* ============================================ */
	.quick-gauges {
		display: grid;
		grid-template-columns: auto auto 1fr;
		gap: 1.5rem;
		align-items: start;
		padding: var(--dp-space-4, 1rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark),
			0 4px 24px var(--dp-glass-shadow);
	}

	/* ============================================ */
	/* CORTEX VIEW - Neural Matrix */
	/* ============================================ */
	.cortex-view {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-4, 1rem);
	}

	.cortex-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--dp-space-3, 0.75rem) var(--dp-space-4, 1rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark);
	}

	.neon-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: var(--dp-font-bold, 700);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--dp-accent-primary);
		text-shadow: 0 0 20px oklch(from var(--dp-accent-primary) l c h / 0.5);
	}

	.cortex-status {
		font-size: var(--dp-text-sm, 0.875rem);
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-dim);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.cortex-status.online {
		color: var(--dp-success);
		text-shadow: 0 0 12px oklch(from var(--dp-success) l c h / 0.6);
	}

	.neural-monitor {
		padding: var(--dp-space-4, 1rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark),
			0 4px 24px var(--dp-glass-shadow);
	}

	.monitor-label {
		font-size: var(--dp-text-xs, 0.75rem);
		font-weight: var(--dp-font-semibold, 600);
		color: var(--dp-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		margin-bottom: var(--dp-space-2, 0.5rem);
	}

	.cortex-minions {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--dp-space-3, 0.75rem);
	}

	/* ============================================ */
	/* SYSTEMS VIEW - Diagnostics */
	/* ============================================ */
	.systems-view {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-4, 1rem);
	}

	.systems-header {
		padding: var(--dp-space-3, 0.75rem) var(--dp-space-4, 1rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark);
	}

	.systems-graphs {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--dp-space-4, 1rem);
	}

	.graph-panel {
		padding: var(--dp-space-4, 1rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark),
			0 4px 24px var(--dp-glass-shadow);
	}

	.systems-gauges {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--dp-space-4, 1rem);
		justify-items: center;
	}

	/* ============================================ */
	/* SIGNALS VIEW - Activity Stream */
	/* ============================================ */
	.signals-view {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-4, 1rem);
	}

	.signals-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--dp-space-3, 0.75rem) var(--dp-space-4, 1rem);
		background: var(--dp-glass-bg);
		border-radius: var(--dp-radius-lg, 12px);
		box-shadow:
			inset 2px 2px 0 var(--dp-bevel-light),
			inset -2px -2px 0 var(--dp-bevel-dark);
	}

	.signal-count {
		font-size: var(--dp-text-sm, 0.875rem);
		font-weight: var(--dp-font-bold, 700);
		color: var(--dp-accent-primary);
		background: oklch(from var(--dp-accent-primary) l c h / 0.2);
		padding: var(--dp-space-1, 0.25rem) var(--dp-space-3, 0.75rem);
		border-radius: var(--dp-radius, 8px);
	}

	.signals-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--dp-space-4, 1rem);
	}

	.signal-monitor,
	.pulse-monitor {
		display: flex;
		flex-direction: column;
		gap: var(--dp-space-3, 0.75rem);
	}

	/* ============================================ */
	/* RESPONSIVE */
	/* ============================================ */
	@media (max-width: 1024px) {
		.main-grid {
			grid-template-columns: 1fr;
		}

		.pulse-sidebar {
			order: -1;
		}

		.quick-gauges {
			grid-template-columns: 1fr 1fr;
		}

		.cortex-minions {
			grid-template-columns: 1fr;
		}

		.systems-graphs {
			grid-template-columns: 1fr;
		}

		.systems-gauges {
			grid-template-columns: repeat(2, 1fr);
		}

		.signals-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
