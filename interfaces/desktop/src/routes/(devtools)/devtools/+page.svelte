<!--
  @file DevPulse Tools
  @route /devtools
  @window DevTools (Ctrl+Shift+Q)

  Unified dev toolbox panel. Floating always-on-top child window.
  Tab-organized sub-tools for developers and juniors. Cross-links
  out to per-service devtools (/devtools/<service>) — availability
  is the priority over strict isolation.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import {
	Activity,
	Boxes,
	BrainCircuit,
	Cpu,
	Database,
	ExternalLink,
	Eye,
	FileText,
	Gauge,
	GitBranch,
	Grid3x3,
	HardDrive,
	Headphones,
	LineChart,
	Mic,
	Network,
	Package,
	PlugZap,
	Radio,
	Settings,
	Sparkles,
	Volume2,
	Workflow,
	X,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import type {
	LaneToggle,
	LaneTraceConfig,
	PlatformConfig,
	ServiceStatusSnapshot,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

// ── Tab state ────────────────────────────────────────────────
type TabId = "overview" | "lanes" | "config";

const tabs = [
	{ id: "overview" as const, label: "Overview", Icon: Grid3x3 },
	{ id: "lanes" as const, label: "Lanes", Icon: Activity },
	{ id: "config" as const, label: "Config", Icon: Settings },
] as const;

let activeTab = $state<TabId>("overview");

// ── Lane config state ────────────────────────────────────────
let laneConfig = $state<LaneTraceConfig | null>(null);
let laneError = $state<string | null>(null);
let laneLoading = $state(false);

async function loadLaneConfig(): Promise<void> {
	laneLoading = true;
	laneError = null;
	const result = await commands.getLaneConfig();
	if (result.status === "ok") {
		laneConfig = result.data;
	} else {
		laneError = result.error;
	}
	laneLoading = false;
}

async function toggleLane(lane: LaneToggle): Promise<void> {
	if (!laneConfig) return;
	const updated: LaneTraceConfig = {
		...laneConfig,
		lanes: laneConfig.lanes.map((l) => (l.lane === lane.lane ? { ...l, enabled: !l.enabled } : l)),
	};
	const result = await commands.setLaneConfig(updated);
	if (result.status === "ok") {
		laneConfig = updated;
	}
}

async function setPreset(preset: "off" | "standard" | "debug"): Promise<void> {
	if (!laneConfig) return;

	const standardLanes = new Set([
		"BrainInference",
		"HelperInference",
		"EscalationInference",
		"Embedding",
		"Reranking",
		"VectorRetrieval",
		"PromptAssembly",
		"ThinkingPipeline",
	]);

	const updated: LaneTraceConfig = {
		...laneConfig,
		verbose: preset === "debug",
		lanes: laneConfig.lanes.map((l) => ({
			...l,
			enabled: preset === "debug" ? true : preset === "off" ? false : standardLanes.has(l.lane),
		})),
	};
	const result = await commands.setLaneConfig(updated);
	if (result.status === "ok") {
		laneConfig = updated;
	}
}

// ── Platform config state ────────────────────────────────────
let platformConfig = $state<PlatformConfig | null>(null);
let services = $state<ServiceStatusSnapshot[] | null>(null);
let configError = $state<string | null>(null);

async function loadPlatformConfig(): Promise<void> {
	const [settings, svc] = await Promise.all([commands.getSettings(), commands.listServices()]);
	if (settings.status === "ok") {
		platformConfig = settings.data;
	} else {
		configError = settings.error;
	}
	if (svc.status === "ok") {
		services = svc.data;
	} else if (!configError) {
		configError = svc.error;
	}
}

function runtimeStateLabel(state: ServiceStatusSnapshot["runtime_state"]): string {
	switch (state) {
		case "not-compiled":
			return "Not compiled";
		case "config-disabled":
			return "Disabled in config";
		case "stopped":
			return "Stopped";
		case "running":
			return "Running";
		case "unknown":
			return "Unknown";
	}
}

function runtimeStateColor(state: ServiceStatusSnapshot["runtime_state"]): string {
	switch (state) {
		case "running":
			return "var(--signal-success)";
		case "stopped":
			return "var(--signal-warning)";
		case "config-disabled":
			return "var(--text-secondary)";
		case "not-compiled":
			return "var(--text-muted)";
		case "unknown":
			return "var(--signal-warning)";
	}
}

type ServiceGroupEntry = { label: string; items: ServiceStatusSnapshot[] };
let serviceGroups: ServiceGroupEntry[] = $derived.by(() => {
	if (!services) return [];
	const byGroup = new Map<string, ServiceStatusSnapshot[]>();
	for (const svc of services) {
		const bucket = byGroup.get(svc.group) ?? [];
		bucket.push(svc);
		byGroup.set(svc.group, bucket);
	}
	const order = ["stores", "graph", "ai", "system"] as const;
	const labels: Record<string, string> = {
		stores: "Stores",
		graph: "Graph",
		ai: "AI",
		system: "System",
	};
	return order
		.filter((k) => byGroup.has(k))
		.map((k) => ({ label: labels[k] ?? k, items: byGroup.get(k) ?? [] }));
});

// ── Tab change triggers data load ────────────────────────────
$effect(() => {
	if (activeTab === "lanes" && !laneConfig && !laneLoading) {
		loadLaneConfig();
	}
	if (activeTab === "config" && !platformConfig) {
		loadPlatformConfig();
	}
});

// ── Window control ───────────────────────────────────────────
function handleClose(): void {
	invoke("close_window", { label: "devtools" });
}

function openWindow(role: string): void {
	commands.openWindow(role as Parameters<typeof commands.openWindow>[0]);
}

// ── Lane grouping helper ─────────────────────────────────────
type LaneGroup = { label: string; lanes: LaneToggle[] };

let laneGroups = $derived<LaneGroup[]>(
	laneConfig
		? [
				{
					label: "GPU",
					lanes: laneConfig.lanes.filter((l) =>
						["BrainInference", "HelperInference", "EscalationInference"].includes(l.lane),
					),
				},
				{
					label: "CPU",
					lanes: laneConfig.lanes.filter((l) =>
						[
							"Embedding",
							"Reranking",
							"SpeechToText",
							"TextToSpeech",
							"VisionEmbedding",
							"PromptAssembly",
							"ThinkingPipeline",
						].includes(l.lane),
					),
				},
				{
					label: "Storage",
					lanes: laneConfig.lanes.filter((l) =>
						["VectorRetrieval", "RelationalQuery", "AnalyticalQuery", "CacheLookup"].includes(
							l.lane,
						),
					),
				},
			]
		: [],
);
</script>

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- ── Titlebar + drag region ──────────────────────────────── -->
	<header
		class="flex items-center justify-between h-9 px-3 border-b border-[var(--border-subtle)]"
		data-tauri-drag-region
	>
		<div class="flex items-center gap-2" data-tauri-drag-region>
			<Text size="xs" weight="semibold" preset="default">DEVPULSE TOOLS</Text>
		</div>
		<Button preset="ghost" size="sm" onclick={handleClose}>
			<X size={12} />
		</Button>
	</header>

	<!-- ── Tab bar ─────────────────────────────────────────────── -->
	<nav class="ds-tabbar">
		{#each tabs as tab}
			<button
				class="ds-tab"
				data-active={activeTab === tab.id ? "true" : "false"}
				onclick={() => (activeTab = tab.id)}
			>
				<tab.Icon size={14} />
				{tab.label}
			</button>
		{/each}
	</nav>

	<!-- ── Tab content ─────────────────────────────────────────── -->
	<main class="flex-1 overflow-y-auto p-4">

		<!-- OVERVIEW TAB — sectioned by axis, semantic-accent driven -->
		{#if activeTab === "overview"}
			<div class="ds-sections">
				<!-- ── Quick Actions (primary) ─────────────────── -->
				<section class="ds-section ds-section--primary">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Quick Actions</h2>
						<p class="ds-section-blurb">
							Most-used surfaces. Lane tracing presets and live config inspector.
						</p>
					</header>
					<div class="ds-tile-grid ds-tile-grid--lg">
						<button class="ds-tile ds-tile--lg" onclick={() => (activeTab = "lanes")}>
							<Activity size={26} class="ds-tile-icon" />
							<span class="ds-tile-title">Lane Tracing</span>
							<span class="ds-tile-blurb">
								Toggle inference pipeline traces. Off / Standard / Debug presets.
							</span>
						</button>
						<button class="ds-tile ds-tile--lg" onclick={() => (activeTab = "config")}>
							<Settings size={26} class="ds-tile-icon" />
							<span class="ds-tile-title">Config Inspector</span>
							<span class="ds-tile-blurb">
								Platform config, service stages, data paths.
							</span>
						</button>
					</div>
				</section>

				<!-- ── Models & AI (primary) ───────────────────── -->
				<section class="ds-section ds-section--primary">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Models &amp; AI</h2>
						<p class="ds-section-blurb">Brain, vision, knowledge engine, integrations.</p>
					</header>
					<div class="ds-tile-grid">
						<button class="ds-tile" onclick={() => openWindow("ModelLoader")}>
							<BrainCircuit size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Model Control</span>
							<span class="ds-tile-blurb">
								Slot management, downloads. Opens its own window.
							</span>
							<ExternalLink size={12} class="ds-tile-corner" />
						</button>
						<a href="/devtools/vision" class="ds-tile">
							<Eye size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Vision (SigLIP2)</span>
							<span class="ds-tile-blurb">
								Image embeddings — preconfigured CPU · 1152-dim L2.
							</span>
						</a>
						<a href="/devtools/claude" class="ds-tile">
							<PlugZap size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Claude Integration</span>
							<span class="ds-tile-blurb">
								MCP server, subscription lane, API providers, council routing.
							</span>
						</a>
					</div>
				</section>

				<!-- ── Voice (secondary) ───────────────────────── -->
				<section class="ds-section ds-section--secondary">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Voice</h2>
						<p class="ds-section-blurb">Listening, speaking, the audio loop.</p>
					</header>
					<div class="ds-tile-grid">
						<button class="ds-tile" onclick={() => openWindow("VoiceLab")}>
							<Headphones size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Voice Lab</span>
							<span class="ds-tile-blurb">
								TTS / STT configuration. Opens its own window.
							</span>
							<ExternalLink size={12} class="ds-tile-corner" />
						</button>
						<a href="/devtools/sts" class="ds-tile">
							<Radio size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Speech-to-Speech</span>
							<span class="ds-tile-blurb">Wake word, routing, council config.</span>
						</a>
						<a href="/devtools/tts" class="ds-tile">
							<Volume2 size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Text-to-Speech</span>
							<span class="ds-tile-blurb">Kokoro / Piper voice config.</span>
						</a>
						<a href="/devtools/stt" class="ds-tile">
							<Mic size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Speech-to-Text</span>
							<span class="ds-tile-blurb">Whisper / Sherpa input + VAD.</span>
						</a>
					</div>
				</section>

				<!-- ── Runtimes (warning) ──────────────────────── -->
				<section class="ds-section ds-section--warning">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Runtimes</h2>
						<p class="ds-section-blurb">Inference engines and the dev IDE host.</p>
					</header>
					<div class="ds-tile-grid">
						<a href="/devtools/candle" class="ds-tile">
							<Cpu size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Candle</span>
							<span class="ds-tile-blurb">
								In-process model runtime. GGUF + SafeTensors.
							</span>
						</a>
						<a href="/devtools/ollama_sidecar" class="ds-tile">
							<Boxes size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Ollama (sidecar)</span>
							<span class="ds-tile-blurb">External Ollama process. HTTP API.</span>
						</a>
						<a href="/devtools/llama_cpp_embedded" class="ds-tile">
							<Package size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">llama.cpp (embedded)</span>
							<span class="ds-tile-blurb">In-process GGUF via llama-cpp-2.</span>
						</a>
						<a href="/devtools/devforge" class="ds-tile">
							<GitBranch size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">DevForge</span>
							<span class="ds-tile-blurb">
								REH server health, extensions, update channel.
							</span>
						</a>
					</div>
				</section>

				<!-- ── Stores (success) ────────────────────────── -->
				<section class="ds-section ds-section--success">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Stores</h2>
						<p class="ds-section-blurb">Persistent and in-memory data layers.</p>
					</header>
					<div class="ds-tile-grid">
						<a href="/devtools/libsql" class="ds-tile">
							<Database size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">LibSQL</span>
							<span class="ds-tile-blurb">
								System + User relational stores. WAL, schema, queries.
							</span>
						</a>
						<a href="/devtools/duckdb" class="ds-tile">
							<LineChart size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">DuckDB</span>
							<span class="ds-tile-blurb">Analytics engine. Telemetry spans, OLAP queries.</span>
						</a>
						<a href="/devtools/surreal" class="ds-tile">
							<Network size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">SurrealDB</span>
							<span class="ds-tile-blurb">Knowledge graph. 3 namespaces. HTTP :8822.</span>
						</a>
						<a href="/devtools/rro" class="ds-tile">
							<Workflow size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">RRO / Vector</span>
							<span class="ds-tile-blurb">Qdrant vector store + dense encoder.</span>
						</a>
						<a href="/devtools/cache" class="ds-tile">
							<HardDrive size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Cache</span>
							<span class="ds-tile-blurb">In-memory KV (Moka). Capacity, TTL, hit-rate.</span>
						</a>
						<a href="/devtools/project_db" class="ds-tile">
							<FileText size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Project DB</span>
							<span class="ds-tile-blurb">Per-project LibSQL. Lazy-loaded, on-demand.</span>
						</a>
					</div>
				</section>

				<!-- ── Telemetry (muted) ───────────────────────── -->
				<section class="ds-section ds-section--muted">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Telemetry</h2>
						<p class="ds-section-blurb">OTel spans, lane baselines, telemetry graph.</p>
					</header>
					<div class="ds-tile-grid">
						<a href="/devtools/telemetry" class="ds-tile">
							<Gauge size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Telemetry</span>
							<span class="ds-tile-blurb">
								OTel spans, lane baselines, exporter config.
							</span>
						</a>
						<button class="ds-tile" onclick={() => openWindow("CortexViewer")}>
							<Activity size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Cortex Viewer</span>
							<span class="ds-tile-blurb">Telemetry graph. Opens its own window.</span>
							<ExternalLink size={12} class="ds-tile-corner" />
						</button>
					</div>
				</section>

				<!-- ── Planned (muted, dashed) ─────────────────── -->
				<section class="ds-section ds-section--muted">
					<header class="ds-section-header">
						<h2 class="ds-section-title">Planned</h2>
						<p class="ds-section-blurb">
							Routes exist so navigation is stable — surfaces unlock as
							services land.
						</p>
					</header>
					<div class="ds-tile-grid">
						<a href="/devtools/cortex" class="ds-tile ds-tile--planned">
							<Sparkles size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">Knowledge Engine</span>
							<span class="ds-tile-blurb">
								Prompt builder, memory lookup, councils. Not yet shipped.
							</span>
							<span class="ds-tile-planned-pill">Planned</span>
						</a>
						<a href="/devtools/mongodb" class="ds-tile ds-tile--planned">
							<FileText size={20} class="ds-tile-icon" />
							<span class="ds-tile-title">MongoDB</span>
							<span class="ds-tile-blurb">
								Document store for docs + images via GridFS. Not yet integrated.
							</span>
							<span class="ds-tile-planned-pill">Planned</span>
						</a>
					</div>
				</section>
			</div>

		<!-- LANES TAB -->
		{:else if activeTab === "lanes"}
			<div class="p-4">
				{#if laneLoading}
					<Text size="sm" color="muted">Loading lane config...</Text>
				{:else if laneError}
					<Text size="sm" color="muted">{laneError}</Text>
				{:else if laneConfig}
					<!-- Preset buttons -->
					<div class="flex items-center gap-2 mb-4">
						<Text size="xs" color="secondary">Preset:</Text>
						<button class="ds-pill" onclick={() => setPreset("off")}>Off</button>
						<button class="ds-pill" onclick={() => setPreset("standard")}>Standard</button>
						<button class="ds-pill" onclick={() => setPreset("debug")}>Debug</button>
					</div>

					<!-- Global toggles -->
					<div class="flex items-center gap-4 mb-4 px-1">
						<label class="flex items-center gap-2 text-xs">
							<input type="checkbox" bind:checked={laneConfig.verbose} onchange={() => laneConfig && commands.setLaneConfig(laneConfig)} />
							Verbose
						</label>
						<label class="flex items-center gap-2 text-xs">
							<input type="checkbox" bind:checked={laneConfig.persist_to_duckdb} onchange={() => laneConfig && commands.setLaneConfig(laneConfig)} />
							Persist to DuckDB
						</label>
					</div>

					<!-- Lane groups -->
					{#each laneGroups as group}
						<div class="mb-4">
							<Text size="xs" weight="semibold" color="secondary">{group.label}</Text>
							<div class="mt-1 space-y-1">
								{#each group.lanes as lane}
									<label class="ds-lane-row">
										<span class="text-xs">{lane.lane}</span>
										<input
											type="checkbox"
											checked={lane.enabled}
											onchange={() => toggleLane(lane)}
											class="ds-lane-check"
										/>
									</label>
								{/each}
							</div>
						</div>
					{/each}
				{/if}
			</div>

		<!-- CONFIG TAB -->
		{:else if activeTab === "config"}
			<div class="p-4">
				{#if configError}
					<Text size="sm" color="muted">{configError}</Text>
				{:else if platformConfig && services}
					<div class="space-y-3">
						<div class="ds-card">
							<Text size="xs" weight="semibold" color="secondary">Platform</Text>
							<div class="mt-2 space-y-1 text-xs">
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Data Directory</span>
									<span class="font-mono text-xs">{platformConfig.data_dir}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Portable Mode</span>
									<span>{platformConfig.portable ? "Yes" : "No"}</span>
								</div>
							</div>
						</div>

						{#each serviceGroups as group}
							<div class="ds-card">
								<Text size="xs" weight="semibold" color="secondary">{group.label}</Text>
								<div class="mt-2 space-y-2 text-xs">
									{#each group.items as svc}
										<div class="flex items-start justify-between gap-3">
											<div class="flex flex-col">
												<span class="font-medium">{svc.public_name}</span>
												<span class="text-[var(--text-muted)] text-[10px]">
													stage {svc.stage}
													· {svc.role}
													· {svc.scope}
													{#if svc.feature_gate}· feature "{svc.feature_gate}"{/if}
												</span>
											</div>
											<div class="flex flex-col items-end gap-0.5">
												<span style={`color: ${runtimeStateColor(svc.runtime_state)}`}>
													{runtimeStateLabel(svc.runtime_state)}
												</span>
												<span class="text-[10px] text-[var(--text-muted)]">
													compiled: {svc.compiled_in ? "yes" : "no"}
													· config: {svc.config_enabled ? "on" : "off"}
													{#if svc.config_critical}· critical{/if}
												</span>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<Text size="sm" color="muted">Loading config...</Text>
				{/if}
			</div>
		{/if}
	</main>
</div>

<style>
	/* ── Dashboard chrome — semantic-accent driven ─────────────
	   Each `.ds-section` declares its own --accent-section-* trio via
	   a modifier class. Tiles inside read those vars; switching
	   accents is one className change. */

	.ds-tabbar {
		display: flex;
		border-bottom: 1px solid var(--border-subtle);
	}

	.ds-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.75rem;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		background: transparent;
		border: 0;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color 150ms ease-out, border-color 150ms ease-out;
	}

	.ds-tab:hover {
		color: var(--text-primary);
	}

	.ds-tab[data-active="true"] {
		color: var(--accent-primary-main);
		border-bottom-color: var(--accent-primary-main);
	}

	.ds-sections {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 1rem;
	}

	.ds-section {
		--accent-section-main: var(--accent-primary-main);
		--accent-section-glow: var(--accent-primary-glow);
		--accent-section-fill: var(--accent-primary-fill);
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
	}

	.ds-section--primary {
		--accent-section-main: var(--accent-primary-main);
		--accent-section-glow: var(--accent-primary-glow);
		--accent-section-fill: var(--accent-primary-fill);
	}
	.ds-section--secondary {
		--accent-section-main: var(--accent-secondary-main);
		--accent-section-glow: var(--accent-secondary-glow);
		--accent-section-fill: var(--accent-secondary-fill);
	}
	.ds-section--success {
		--accent-section-main: var(--accent-success-main);
		--accent-section-glow: var(--accent-success-glow);
		--accent-section-fill: var(--accent-success-fill);
	}
	.ds-section--warning {
		--accent-section-main: var(--accent-warning-main);
		--accent-section-glow: var(--accent-warning-glow);
		--accent-section-fill: var(--accent-warning-fill);
	}
	.ds-section--muted {
		--accent-section-main: var(--accent-muted-main);
		--accent-section-glow: var(--accent-muted-glow);
		--accent-section-fill: var(--accent-muted-fill);
	}

	.ds-section-header {
		display: flex;
		align-items: baseline;
		gap: 0.625rem;
		padding-inline: 0.25rem;
		border-left: 2px solid var(--accent-section-main);
		padding-left: 0.625rem;
	}

	.ds-section-title {
		margin: 0;
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--accent-section-main);
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.ds-section-blurb {
		margin: 0;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}

	.ds-tile-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
		gap: 0.625rem;
	}

	.ds-tile-grid--lg {
		grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
		gap: 0.75rem;
	}

	.ds-tile {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.875rem 1rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
		text-align: left;
		text-decoration: none;
		color: var(--text-primary);
		cursor: pointer;
		transition:
			border-color 150ms ease-out,
			box-shadow 150ms ease-out,
			transform 150ms ease-out,
			background 150ms ease-out;
		font: inherit;
	}

	.ds-tile:hover {
		border-color: var(--accent-section-main);
		background: color-mix(in oklch, var(--accent-section-fill) 100%, var(--surface-raised));
		box-shadow: 0 0 1.25rem 0 var(--accent-section-glow);
		transform: translateY(-1px);
	}

	.ds-tile:focus-visible {
		outline: 2px solid var(--accent-section-main);
		outline-offset: 2px;
	}

	.ds-tile--lg {
		padding: 1.25rem 1.25rem 1.125rem;
		gap: 0.5rem;
		min-height: 6.5rem;
	}

	.ds-tile--planned {
		border-style: dashed;
		opacity: 0.78;
	}

	.ds-tile--planned:hover {
		opacity: 1;
	}

	.ds-tile-planned-pill {
		position: absolute;
		top: 0.625rem;
		right: 0.625rem;
		padding: 0.125rem 0.5rem;
		font-size: var(--font-size-xs);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent-section-main);
		background: var(--accent-section-fill);
		border: var(--border-width-hairline) solid var(--accent-section-main);
		border-radius: 999px;
	}

	:global(.ds-tile-icon) {
		color: var(--accent-section-main);
	}

	.ds-tile-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		line-height: 1.2;
	}

	.ds-tile--lg .ds-tile-title {
		font-size: var(--font-size-base);
	}

	.ds-tile-blurb {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		line-height: 1.4;
	}

	:global(.ds-tile-corner) {
		position: absolute;
		top: 0.625rem;
		right: 0.625rem;
		color: var(--text-secondary);
	}

	.ds-pill {
		padding: 0.25rem 0.625rem;
		font-size: var(--font-size-xs);
		border-radius: 999px;
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
		color: var(--text-primary);
		cursor: pointer;
		transition: border-color 150ms ease-out, color 150ms ease-out;
	}

	.ds-pill:hover {
		border-color: var(--accent-primary-main);
		color: var(--accent-primary-main);
	}

	.ds-lane-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		cursor: pointer;
	}

	.ds-lane-row:hover {
		background: var(--surface-raised);
	}

	.ds-lane-check {
		accent-color: var(--accent-primary-main);
	}

	.ds-card {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-subtle);
	}
</style>
