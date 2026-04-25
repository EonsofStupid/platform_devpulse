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
	Palette,
	PlugZap,
	Radio,
	Settings,
	Sparkles,
	Speaker,
	Volume2,
	Workflow,
	X,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { RepoDownloadButton } from "$lib/domains/platform/index.js";
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
	<nav class="flex border-b border-[var(--border-subtle)]">
		{#each tabs as tab}
			<button
				class="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors
					{activeTab === tab.id
						? 'text-[var(--color-teal-400)] border-b-2 border-[var(--color-teal-400)]'
						: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
				onclick={() => (activeTab = tab.id)}
			>
				<tab.Icon size={14} />
				{tab.label}
			</button>
		{/each}
	</nav>

	<!-- ── Tab content ─────────────────────────────────────────── -->
	<main class="flex-1 overflow-y-auto p-4">

		<!-- OVERVIEW TAB -->
		{#if activeTab === "overview"}
			<!--
				Phase 4b harness (SPRINT-DEVTOOLS-FOUNDATIONAL). Delete in Phase 8.
				Tests RepoDownloadButton end-to-end against a known-good HF repo.
				Real per-devtool usage lives on the Phi / Persona devtools
				in Phases 5 + 7.
			-->
			<div class="mb-3 flex items-center gap-2 p-3 rounded-lg" style="background: var(--surface-raised); border: 1px dashed var(--border-subtle);">
				<span class="text-xs font-medium">Phase 4b harness:</span>
				<RepoDownloadButton repoId="microsoft/phi-4-mini-instruct" label="Install Phi-4 Mini (test)" />
				<span class="text-xs text-[var(--text-secondary)]">One-click bundle download · delete this row in Phase 8.</span>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<!-- Inline tools -->
				<button
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
					onclick={() => (activeTab = "lanes")}
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Lane Tracing</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Toggle inference pipeline traces. Baseline analysis.</span>
				</button>

				<button
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
					onclick={() => (activeTab = "config")}
				>
					<div class="flex items-center gap-2">
						<Settings size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Config Inspector</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">View platform config, services, data paths.</span>
				</button>

				<!-- Telemetry devtool (OTel + spans + baselines) -->
				<a
					href="/devtools/telemetry"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Telemetry</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">OTel spans, lane baselines, pipeline tracing, exporter config.</span>
				</a>

				<!-- External window tools -->
				<button
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
					onclick={() => openWindow("VoiceLab")}
				>
					<div class="flex items-center gap-2">
						<ExternalLink size={14} class="text-[var(--text-secondary)]" />
						<span class="text-sm font-medium">Voice Lab</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">TTS/STT configuration. Opens separate window.</span>
				</button>

				<button
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
					onclick={() => openWindow("ModelLoader")}
				>
					<div class="flex items-center gap-2">
						<ExternalLink size={14} class="text-[var(--text-secondary)]" />
						<span class="text-sm font-medium">Model Control</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Slot management, downloads. Opens separate window.</span>
				</button>

				<button
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
					onclick={() => openWindow("CortexViewer")}
				>
					<div class="flex items-center gap-2">
						<ExternalLink size={14} class="text-[var(--text-secondary)]" />
						<span class="text-sm font-medium">Cortex Viewer</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Telemetry graph. Opens separate window.</span>
				</button>

				<a
					href="/devtools/claude"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Claude Integration</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">MCP server, subscription lane, API providers, council routing.</span>
				</a>

				<!-- STS / TTS / STT / Cortex subtabs -->
				<a
					href="/devtools/sts"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Speech-to-Speech</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Wake word, routing, council config.</span>
				</a>

				<a
					href="/devtools/tts"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Text-to-Speech</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Kokoro / Piper voice config.</span>
				</a>

				<a
					href="/devtools/stt"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Speech-to-Text</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Whisper / Sherpa input + VAD.</span>
				</a>

				<a
					href="/devtools/vision"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Vision (SigLIP2)</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Image embeddings — preconfigured CPU · 1152-dim L2.</span>
				</a>

				<a
					href="/devtools/cortex"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Knowledge Engine</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Prompt builder, memory, councils.</span>
				</a>

				<!-- Infrastructure service devtools -->
				<a
					href="/devtools/libsql"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">LibSQL</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">System + User relational stores. WAL, schema, queries.</span>
				</a>

				<a
					href="/devtools/duckdb"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-purple-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-purple-400)]" />
						<span class="text-sm font-medium">DuckDB</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Analytics engine. Telemetry spans, OLAP queries.</span>
				</a>

				<a
					href="/devtools/surreal"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">SurrealDB</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Knowledge graph. 3 namespaces. HTTP :8822.</span>
				</a>

				<a
					href="/devtools/rro"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">RRO / Vector</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Qdrant vector store + dense encoder.</span>
				</a>

				<a
					href="/devtools/cache"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Cache</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">In-memory KV (Moka). Capacity, TTL, hit-rate.</span>
				</a>

				<a
					href="/devtools/project_db"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-teal-400)]" />
						<span class="text-sm font-medium">Project DB</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Per-project LibSQL. Lazy-loaded, on-demand.</span>
				</a>

				<!-- Runtimes axis -->
				<a
					href="/devtools/devforge"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-purple-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-purple-400)]" />
						<span class="text-sm font-medium">DevForge</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">REH server health, extensions, update channel.</span>
				</a>

				<a
					href="/devtools/candle"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-purple-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-purple-400)]" />
						<span class="text-sm font-medium">Candle</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">In-process model runtime. GGUF + SafeTensors.</span>
				</a>

				<a
					href="/devtools/ollama_sidecar"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-purple-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-purple-400)]" />
						<span class="text-sm font-medium">Ollama (sidecar)</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">External Ollama process. HTTP API.</span>
				</a>

				<a
					href="/devtools/llama_cpp_embedded"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-purple-600)] transition-colors text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--color-purple-400)]" />
						<span class="text-sm font-medium">llama.cpp (embedded)</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">In-process GGUF via llama-cpp-2. Not built yet.</span>
				</a>

				<a
					href="/devtools/mongodb"
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-dashed border-[var(--border-subtle)] opacity-50 text-left"
				>
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--text-secondary)]" />
						<span class="text-sm font-medium">MongoDB</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Document store. Planned — not active.</span>
				</a>

				<!-- Placeholder for VPB -->
				<div
					class="flex flex-col gap-1 p-3 rounded-lg bg-[var(--surface-raised)] border border-dashed border-[var(--border-subtle)] opacity-50"
				>
					<div class="flex items-center gap-2">
						<Palette size={16} class="text-[var(--text-secondary)]" />
						<span class="text-sm font-medium">StyleOS / VPB</span>
					</div>
					<span class="text-xs text-[var(--text-secondary)]">Visual page builder. Coming soon.</span>
				</div>
			</div>

		<!-- LANES TAB -->
		{:else if activeTab === "lanes"}
			{#if laneLoading}
				<Text size="sm" color="muted">Loading lane config...</Text>
			{:else if laneError}
				<Text size="sm" color="muted">{laneError}</Text>
			{:else if laneConfig}
				<!-- Preset buttons -->
				<div class="flex items-center gap-2 mb-4">
					<Text size="xs" color="secondary">Preset:</Text>
					<button class="px-2 py-1 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)]" onclick={() => setPreset("off")}>Off</button>
					<button class="px-2 py-1 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)]" onclick={() => setPreset("standard")}>Standard</button>
					<button class="px-2 py-1 text-xs rounded bg-[var(--surface-raised)] border border-[var(--border-subtle)] hover:border-[var(--color-teal-600)]" onclick={() => setPreset("debug")}>Debug</button>
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
								<label class="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[var(--surface-raised)] cursor-pointer">
									<span class="text-xs">{lane.lane}</span>
									<input
										type="checkbox"
										checked={lane.enabled}
										onchange={() => toggleLane(lane)}
										class="accent-[var(--color-teal-400)]"
									/>
								</label>
							{/each}
						</div>
					</div>
				{/each}
			{/if}

		<!-- CONFIG TAB -->
		{:else if activeTab === "config"}
			{#if configError}
				<Text size="sm" color="muted">{configError}</Text>
			{:else if platformConfig && services}
				<div class="space-y-3">
					<div class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]">
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
						<div
							class="p-3 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)]"
						>
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
		{/if}
	</main>
</div>
