<script lang="ts">
	/**
	 * ModelLoaderPanel - UNIFIED model management interface
	 *
	 * ALL IN ONE:
	 * - Browse local models
	 * - Download from HuggingFace
	 * - Assign to roles
	 * - Load/unload
	 * - Hardware gauges
	 */
	import { onMount } from "svelte";
	import { invoke } from "@tauri-apps/api/core";
	import HardwareGauges from "./HardwareGauges.svelte";
	import ModelProgressBar from "./ModelProgressBar.svelte";
	import type { ModelRole, ModelStatus } from "./types";

	interface ModelAssignment {
		role: ModelRole;
		modelId: string | null;
		modelName: string | null;
		modelPath: string | null;
		status: ModelStatus;
		vramUsage?: number;
		device?: string;
		loadTime?: number;
		loadProgress?: number;
		loadStage?: string;
		error?: string | null;
	}

	interface LocalModel {
		id: string;
		name: string;
		size_gb: number;
		format: string;
		path: string;
		is_vision?: boolean;
		quantization?: string;
	}

	interface HFModel {
		repo_id: string;
		filename: string;
		size_gb: number;
		quantization: string;
		downloads: number;
	}

	// Model assignments by role
	let assignments = $state<ModelAssignment[]>([
		{
			role: "llm",
			modelId: null,
			modelName: null,
			modelPath: null,
			status: "unloaded",
		},
		{
			role: "embedder",
			modelId: null,
			modelName: null,
			modelPath: null,
			status: "unloaded",
		},
		{
			role: "reranker",
			modelId: null,
			modelName: null,
			modelPath: null,
			status: "unloaded",
		},
		{
			role: "tts",
			modelId: null,
			modelName: null,
			modelPath: null,
			status: "unloaded",
		},
		{
			role: "stt",
			modelId: null,
			modelName: null,
			modelPath: null,
			status: "unloaded",
		},
	]);

	// Local discovered models
	let localModels = $state<LocalModel[]>([]);

	// HuggingFace models (search results)
	let hfModels = $state<HFModel[]>([]);
	let hfSearchQuery = $state("");
	let hfSearching = $state(false);

	// Download state
	let activeDownloads = $state<
		Map<string, { progress: number; speed: string; eta: string }>
	>(new Map());

	// UI State
	let activeTab = $state<"local" | "download">("local");
	let selectedRole = $state<ModelRole | null>(null);
	let customPath = $state("");
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Role display info
	const roleInfo: Record<
		ModelRole,
		{ label: string; icon: string; description: string }
	> = {
		llm: {
			label: "LLM",
			icon: "🧠",
			description: "Main reasoning model (Qwen3-VL)",
		},
		embedder: {
			label: "EMBEDDER",
			icon: "📐",
			description: "Text embeddings for RAG",
		},
		reranker: {
			label: "RERANKER",
			icon: "🎯",
			description: "Relevance scoring",
		},
		tts: {
			label: "TTS",
			icon: "🔊",
			description: "Text-to-Speech (Kokoro)",
		},
		stt: {
			label: "STT",
			icon: "🎤",
			description: "Speech-to-Text (Whisper)",
		},
	};

	onMount(() => {
		loadAssignments();
		loadLocalModels();
		setupEventListeners();
	});

	function setupEventListeners() {
		import("@tauri-apps/api/event").then(({ listen }) => {
			// Model loading progress
			listen<{
				role: string;
				stage: string;
				progress: number;
				message: string;
			}>("model-load-progress", (event) => {
				const { role, stage, progress, message } = event.payload;
				assignments = assignments.map((a) =>
					a.role === role
						? {
								...a,
								loadProgress: progress,
								loadStage: stage,
								status:
									stage === "error"
										? ("error" as ModelStatus)
										: stage === "ready"
											? ("loaded" as ModelStatus)
											: ("loading" as ModelStatus),
								error: stage === "error" ? message : null,
							}
						: a,
				);
			});

			// Download progress
			listen<{
				filename: string;
				progress: number;
				speed: string;
				eta: string;
			}>("download-progress", (event) => {
				const { filename, progress, speed, eta } = event.payload;
				activeDownloads = new Map(
					activeDownloads.set(filename, { progress, speed, eta }),
				);
			});

			// Download complete
			listen<{ filename: string }>("download-complete", (event) => {
				activeDownloads.delete(event.payload.filename);
				activeDownloads = new Map(activeDownloads);
				loadLocalModels(); // Refresh local models
			});
		});
	}

	async function loadAssignments() {
		try {
			const data = await invoke<Record<string, string | null>>(
				"list_model_assignments",
			);
			assignments = assignments.map((a) => ({
				...a,
				modelId: data[a.role] || null,
				modelName: data[a.role] || null,
			}));
		} catch (e) {
			console.error("Failed to load assignments:", e);
		}
	}

	async function loadLocalModels(path?: string) {
		try {
			loading = true;
			let models: LocalModel[];

			if (path) {
				models = await invoke<LocalModel[]>("discover_models_cmd", {
					path,
				});
			} else {
				models = await invoke<LocalModel[]>("list_local_models");
			}

			localModels = models.map((m: any) => ({
				id: m.id,
				name: m.name,
				size_gb: m.size_gb,
				format: m.format,
				path: m.path,
				is_vision: m.is_vision,
				quantization: m.quantization,
			}));

			console.log("Discovered", localModels.length, "models");
		} catch (e) {
			console.error("Failed to load models:", e);
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function scanCustomPath() {
		if (!customPath.trim()) return;
		await loadLocalModels(customPath);
	}

	async function browseForFolder() {
		try {
			const { open } = await import("@tauri-apps/plugin-dialog");
			const selected = await open({
				directory: true,
				multiple: false,
				title: "Select Models Directory",
			});
			if (selected) {
				customPath = selected as string;
				await loadLocalModels(customPath);
			}
		} catch (e) {
			console.error("Browse failed:", e);
		}
	}

	async function assignModel(role: ModelRole, model: LocalModel) {
		try {
			await invoke("assign_model_role", { role, modelId: model.id });

			assignments = assignments.map((a) =>
				a.role === role
					? {
							...a,
							modelId: model.id,
							modelName: model.name,
							modelPath: model.path,
							status: "unloaded" as ModelStatus,
						}
					: a,
			);

			selectedRole = null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function loadModel(role: ModelRole) {
		const assignment = assignments.find((a) => a.role === role);
		if (!assignment?.modelPath) {
			error = `No model assigned to ${role}. Select a model first.`;
			return;
		}

		assignments = assignments.map((a) =>
			a.role === role
				? {
						...a,
						status: "loading" as ModelStatus,
						loadProgress: 0,
						loadStage: "checking",
						error: null,
					}
				: a,
		);

		try {
			const result = await invoke<{
				success: boolean;
				role: string;
				model_id: string;
				vram_usage_gb: number | null;
				device: string | null;
				load_time_secs: number | null;
				error: string | null;
			}>("load_model_for_role", {
				role,
				modelPath: assignment.modelPath,
			});

			if (result.success) {
				assignments = assignments.map((a) =>
					a.role === role
						? {
								...a,
								status: "loaded" as ModelStatus,
								loadProgress: 100,
								loadStage: "ready",
								vramUsage: result.vram_usage_gb ?? undefined,
								device: result.device ?? undefined,
								loadTime: result.load_time_secs ?? undefined,
								error: null,
							}
						: a,
				);
			} else {
				assignments = assignments.map((a) =>
					a.role === role
						? {
								...a,
								status: "error" as ModelStatus,
								error: result.error ?? "Load failed",
							}
						: a,
				);
			}
		} catch (e) {
			assignments = assignments.map((a) =>
				a.role === role
					? {
							...a,
							status: "error" as ModelStatus,
							error: e instanceof Error ? e.message : String(e),
						}
					: a,
			);
		}
	}

	async function unloadModel(role: ModelRole) {
		try {
			await invoke("unload_model_for_role", { role });
			assignments = assignments.map((a) =>
				a.role === role
					? {
							...a,
							status: "unloaded" as ModelStatus,
							vramUsage: undefined,
							device: undefined,
							loadProgress: undefined,
							loadStage: undefined,
						}
					: a,
			);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function searchHF() {
		if (!hfSearchQuery.trim()) return;
		hfSearching = true;
		try {
			// Recommended models for DevPulse
			hfModels = [
				{
					repo_id: "Qwen/Qwen3-VL-8B-Instruct-GGUF",
					filename: "qwen3-vl-8b-q6k.gguf",
					size_gb: 6.2,
					quantization: "Q6_K",
					downloads: 15420,
				},
				{
					repo_id: "Qwen/Qwen3-VL-4B-Instruct-GGUF",
					filename: "qwen3-vl-4b-q6k.gguf",
					size_gb: 3.1,
					quantization: "Q6_K",
					downloads: 8934,
				},
				{
					repo_id: "Qwen/Qwen3-Embed-0.6B-GGUF",
					filename: "qwen3-embed-0.6b.gguf",
					size_gb: 0.6,
					quantization: "F16",
					downloads: 5210,
				},
			];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			hfSearching = false;
		}
	}

	async function downloadModel(model: HFModel) {
		try {
			activeDownloads = new Map(
				activeDownloads.set(model.filename, {
					progress: 0,
					speed: "0 MB/s",
					eta: "calculating...",
				}),
			);
			// TODO: Wire to real download command
		} catch (e) {
			activeDownloads.delete(model.filename);
			activeDownloads = new Map(activeDownloads);
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function getStatusColor(status: ModelStatus): string {
		switch (status) {
			case "loaded":
				return "#22c55e";
			case "loading":
				return "#f59e0b";
			case "error":
				return "#ef4444";
			default:
				return "rgba(255,255,255,0.3)";
		}
	}

	function getStatusText(status: ModelStatus): string {
		switch (status) {
			case "loaded":
				return "LOADED";
			case "loading":
				return "LOADING...";
			case "error":
				return "ERROR";
			default:
				return "NOT LOADED";
		}
	}
</script>

<div class="model-panel">
	<header class="panel-header">
		<h1>🎛️ MODEL CONTROL</h1>
		<p class="subtitle">Load and manage AI models</p>
	</header>

	<section class="hardware-section glass-subtle">
		<HardwareGauges />
	</section>

	<section class="roles-section">
		<h2>Model Assignments</h2>
		<div class="roles-grid">
			{#each assignments as assignment (assignment.role)}
				{@const info = roleInfo[assignment.role]}
				<div
					class="role-card glass"
					class:selected={selectedRole === assignment.role}
					class:loaded={assignment.status === "loaded"}
				>
					<div class="role-header">
						<span class="role-icon">{info.icon}</span>
						<span class="role-label">{info.label}</span>
						<span
							class="status-badge"
							style="background: {getStatusColor(
								assignment.status,
							)}"
						>
							{getStatusText(assignment.status)}
						</span>
					</div>

					<div class="role-model">
						{#if assignment.modelName}
							<span class="model-name"
								>{assignment.modelName}</span
							>
							{#if assignment.status === "loaded"}
								<div class="model-stats">
									{#if assignment.vramUsage}<span
											>VRAM: {assignment.vramUsage.toFixed(
												1,
											)}GB</span
										>{/if}
									{#if assignment.device}<span
											>{assignment.device}</span
										>{/if}
								</div>
							{/if}
						{:else}
							<span class="no-model">No model assigned</span>
						{/if}
					</div>

					{#if assignment.status === "loading" && assignment.loadProgress !== undefined}
						<div class="loading-progress">
							<ModelProgressBar
								progress={assignment.loadProgress}
								stage={(assignment.loadStage || "idle") as
									| "idle"
									| "checking"
									| "loading_weights"
									| "loading_projector"
									| "warming_up"
									| "ready"
									| "failed"}
							/>
						</div>
					{/if}

					{#if assignment.error}
						<div class="role-error">{assignment.error}</div>
					{/if}

					<div class="role-actions">
						{#if assignment.status === "loaded"}
							<button
								class="btn-unload"
								onclick={() => unloadModel(assignment.role)}
								>Unload</button
							>
						{:else if assignment.modelId}
							<button
								class="btn-load"
								onclick={() => loadModel(assignment.role)}
								disabled={assignment.status === "loading"}
							>
								{assignment.status === "loading"
									? "Loading..."
									: "Load"}
							</button>
						{/if}
						<button
							class="btn-assign"
							onclick={() =>
								(selectedRole =
									selectedRole === assignment.role
										? null
										: assignment.role)}
						>
							{selectedRole === assignment.role
								? "Cancel"
								: assignment.modelId
									? "Change"
									: "Assign"}
						</button>
					</div>
				</div>
			{/each}
		</div>
	</section>

	{#if selectedRole}
		<section class="browser-section glass">
			<div class="browser-header">
				<h2>Select Model for {roleInfo[selectedRole].label}</h2>
				<button class="close-btn" onclick={() => (selectedRole = null)}
					>×</button
				>
			</div>

			<div class="browser-tabs">
				<button
					class="tab"
					class:active={activeTab === "local"}
					onclick={() => (activeTab = "local")}
				>
					📁 Local Models
				</button>
				<button
					class="tab"
					class:active={activeTab === "download"}
					onclick={() => (activeTab = "download")}
				>
					⬇️ Download
				</button>
			</div>

			{#if activeTab === "local"}
				<div class="tab-content">
					<div class="path-scanner">
						<input
							type="text"
							bind:value={customPath}
							placeholder="Enter path or browse..."
						/>
						<button onclick={browseForFolder}>Browse</button>
						<button
							onclick={scanCustomPath}
							disabled={!customPath.trim() || loading}
						>
							{loading ? "Scanning..." : "Scan"}
						</button>
					</div>

					<div class="models-list">
						{#if loading}
							<div class="loading-state">
								Scanning for models...
							</div>
						{:else if localModels.length === 0}
							<div class="empty-state">
								<p>No models found.</p>
								<p>
									Browse to a folder containing .gguf files or
									download models.
								</p>
							</div>
						{:else}
							{#each localModels as model (model.id)}
								<button
									class="model-item"
									onclick={() =>
										assignModel(selectedRole!, model)}
								>
									<div class="model-info">
										<span class="model-name"
											>{model.name}</span
										>
										<span class="model-meta">
											{model.size_gb.toFixed(1)} GB • {model.format}
											{#if model.quantization}
												• {model.quantization}{/if}
											{#if model.is_vision}
												• 👁️ Vision{/if}
										</span>
									</div>
									<span class="select-btn">Select</span>
								</button>
							{/each}
						{/if}
					</div>
				</div>
			{/if}

			{#if activeTab === "download"}
				<div class="tab-content">
					<div class="hf-search">
						<input
							type="text"
							bind:value={hfSearchQuery}
							placeholder="Search HuggingFace (e.g., qwen3 gguf)..."
							onkeydown={(e) => e.key === "Enter" && searchHF()}
						/>
						<button onclick={searchHF} disabled={hfSearching}>
							{hfSearching ? "Searching..." : "Search"}
						</button>
					</div>

					<h3>Recommended Models</h3>
					<div class="models-list">
						{#each hfModels as model (model.repo_id + model.filename)}
							{@const downloading = activeDownloads.has(
								model.filename,
							)}
							<div class="model-item">
								<div class="model-info">
									<span class="model-name"
										>{model.filename}</span
									>
									<span class="model-meta">
										{model.repo_id} • {model.size_gb.toFixed(
											1,
										)} GB • {model.quantization}
									</span>
								</div>
								{#if downloading}
									{@const dl = activeDownloads.get(
										model.filename,
									)!}
									<div class="download-progress">
										<div
											class="progress-bar"
											style="width: {dl.progress}%"
										></div>
										<span>{dl.progress}% • {dl.speed}</span>
									</div>
								{:else}
									<button
										class="download-btn"
										onclick={() => downloadModel(model)}
										>Download</button
									>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>
	{/if}

	{#if error}
		<div class="error-banner">
			<span>{error}</span>
			<button onclick={() => (error = null)}>×</button>
		</div>
	{/if}
</div>

<style>
	.model-panel {
		padding: 1.5rem;
		max-width: 1200px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.panel-header {
		text-align: center;
	}

	.panel-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0;
		color: #fff;
	}

	.subtitle {
		color: rgba(255, 255, 255, 0.5);
		margin: 0.25rem 0 0 0;
	}

	.hardware-section {
		padding: 1rem;
		border-radius: 12px;
	}

	.roles-section h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 1rem 0;
		color: rgba(255, 255, 255, 0.7);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.roles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 1rem;
	}

	.role-card {
		padding: 1rem;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.2s ease;
	}

	.role-card.selected {
		border-color: #6366f1;
		box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
	}

	.role-card.loaded {
		border-color: rgba(34, 197, 94, 0.5);
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.role-icon {
		font-size: 1.25rem;
	}

	.role-label {
		font-weight: 600;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.9);
		flex: 1;
	}

	.status-badge {
		font-size: 0.65rem;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-weight: 600;
		color: #fff;
	}

	.role-model {
		margin-bottom: 0.75rem;
	}

	.model-name {
		font-size: 0.85rem;
		color: #fff;
		display: block;
	}

	.model-stats {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		margin-top: 0.25rem;
		display: flex;
		gap: 0.75rem;
	}

	.no-model {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
		font-style: italic;
	}

	.loading-progress {
		margin-bottom: 0.75rem;
	}

	.role-error {
		font-size: 0.75rem;
		color: #ef4444;
		margin-bottom: 0.5rem;
		padding: 0.5rem;
		background: rgba(239, 68, 68, 0.1);
		border-radius: 6px;
	}

	.role-actions {
		display: flex;
		gap: 0.5rem;
	}

	.role-actions button {
		flex: 1;
		padding: 0.5rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-load {
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.4);
		color: #22c55e;
	}

	.btn-load:hover:not(:disabled) {
		background: rgba(34, 197, 94, 0.3);
	}

	.btn-unload {
		background: rgba(239, 68, 68, 0.2);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: #ef4444;
	}

	.btn-unload:hover {
		background: rgba(239, 68, 68, 0.3);
	}

	.btn-assign {
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.4);
		color: #818cf8;
	}

	.btn-assign:hover {
		background: rgba(99, 102, 241, 0.3);
	}

	.browser-section {
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid rgba(99, 102, 241, 0.3);
	}

	.browser-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.browser-header h2 {
		font-size: 1.1rem;
		margin: 0;
		color: #fff;
	}

	.close-btn {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover {
		color: #fff;
	}

	.browser-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 0.5rem;
	}

	.tab {
		padding: 0.5rem 1rem;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.5);
		font-size: 0.9rem;
		cursor: pointer;
		border-radius: 6px 6px 0 0;
		transition: all 0.15s ease;
	}

	.tab:hover {
		color: rgba(255, 255, 255, 0.8);
	}

	.tab.active {
		color: #fff;
		background: rgba(255, 255, 255, 0.1);
	}

	.tab-content {
		min-height: 200px;
	}

	.path-scanner {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.path-scanner input {
		flex: 1;
		padding: 0.6rem 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		color: #fff;
		font-size: 0.85rem;
	}

	.path-scanner input::placeholder {
		color: rgba(255, 255, 255, 0.4);
	}

	.path-scanner button {
		padding: 0.6rem 1rem;
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.4);
		border-radius: 6px;
		color: #818cf8;
		font-size: 0.85rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.path-scanner button:hover:not(:disabled) {
		background: rgba(99, 102, 241, 0.3);
	}

	.hf-search {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.hf-search input {
		flex: 1;
		padding: 0.6rem 0.75rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		color: #fff;
		font-size: 0.85rem;
	}

	.hf-search button {
		padding: 0.6rem 1rem;
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.4);
		border-radius: 6px;
		color: #22c55e;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.tab-content h3 {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.6);
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.models-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.model-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: rgba(0, 0, 0, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.model-item:hover {
		background: rgba(99, 102, 241, 0.15);
		border-color: rgba(99, 102, 241, 0.3);
	}

	.model-info {
		flex: 1;
	}

	.model-info .model-name {
		font-weight: 500;
	}

	.model-meta {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		display: block;
		margin-top: 0.25rem;
	}

	.select-btn,
	.download-btn {
		padding: 0.4rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 500;
		cursor: pointer;
	}

	.select-btn {
		background: rgba(99, 102, 241, 0.2);
		border: 1px solid rgba(99, 102, 241, 0.4);
		color: #818cf8;
	}

	.download-btn {
		background: rgba(34, 197, 94, 0.2);
		border: 1px solid rgba(34, 197, 94, 0.4);
		color: #22c55e;
	}

	.download-progress {
		width: 120px;
		position: relative;
	}

	.download-progress .progress-bar {
		height: 4px;
		background: #22c55e;
		border-radius: 2px;
	}

	.download-progress span {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.6);
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 2rem;
		color: rgba(255, 255, 255, 0.5);
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.error-banner {
		padding: 0.75rem 1rem;
		background: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: #ef4444;
		font-size: 0.85rem;
	}

	.error-banner button {
		background: none;
		border: none;
		color: inherit;
		font-size: 1.25rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.glass-subtle {
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(8px);
	}

	.glass {
		background: rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(12px);
	}
</style>
