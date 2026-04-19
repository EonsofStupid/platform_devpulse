<!--
	@file /devtools/rro — RRO vector store devtool
	@route /devtools/rro
	@window DevTools (Ctrl+Shift+Z)

	Full configuration panel: retrieval tuning (sliders driven by param meta),
	collection management, search test bench with quality feedback.
	Config persists to preferences.json.
-->
<script lang="ts">
import {
	type Compass,
	Database,
	HeartPulse,
	Plus,
	RefreshCw,
	Search,
	Settings2,
	Shapes,
	Trash2,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Slider } from "$lib/design/components/slider/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type {
	CollectionInfo,
	RetrievalConfig,
	RetrievalParamMeta,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

// ── Tab state ───────────────────────────────────────────────
type TabId = "config" | "collections" | "search" | "status";
let activeTab = $state<TabId>("config");

const tabs: { id: TabId; label: string; Icon: typeof Compass }[] = [
	{ id: "config", label: "Config", Icon: Settings2 },
	{ id: "collections", label: "Collections", Icon: Database },
	{ id: "search", label: "Search", Icon: Search },
	{ id: "status", label: "Status", Icon: Shapes },
];

// ── Health state ────────────────────────────────────────────
let healthReport = $state<VectorHealthReport | null>(null);
let healthError = $state<string | null>(null);
let healthLoading = $state(false);

async function loadHealth(): Promise<void> {
	healthLoading = true;
	healthError = null;
	const result = await commands.getVectorHealth();
	if (result.status === "ok") {
		healthReport = result.data;
	} else {
		healthError = result.error;
	}
	healthLoading = false;
}

// ── Param meta (layman labels from Rust) ────────────────────
let paramMeta = $state<RetrievalParamMeta[]>([]);

async function loadParamMeta(): Promise<void> {
	const result = await commands.getRetrievalParamMeta();
	if (result.status === "ok") {
		paramMeta = result.data;
	}
}

// ── Retrieval config state ──────────────────────────────────
let retrievalConfig = $state<RetrievalConfig | null>(null);
let configError = $state<string | null>(null);

async function loadConfig(): Promise<void> {
	// Try persisted preference first
	const persisted = await commands.getPreference("rro:retrieval_config");
	if (persisted.status === "ok" && persisted.data) {
		try {
			const saved: RetrievalConfig = JSON.parse(persisted.data);
			const setResult = await commands.setVectorConfig(saved);
			if (setResult.status === "ok") {
				retrievalConfig = saved;
				return;
			}
		} catch {
			// fall through to runtime default
		}
	}
	// Fallback: read current runtime config
	const result = await commands.getVectorConfig();
	if (result.status === "ok") {
		retrievalConfig = result.data;
	} else {
		configError = result.error;
	}
}

async function persistConfig(config: RetrievalConfig): Promise<void> {
	await commands.setPreference("rro:retrieval_config", JSON.stringify(config));
}

const presets = [
	{ name: "conservative", label: "Conservative" },
	{ name: "balanced", label: "Balanced" },
	{ name: "aggressive", label: "Aggressive" },
	{ name: "precision", label: "Precision" },
] as const;

const presetMap: Record<string, RetrievalConfig> = {
	conservative: {
		preset: "conservative",
		top_k: 50,
		score_threshold: 0.7,
		rerank_top_n: 5,
		fusion_k: 40,
	},
	balanced: {
		preset: "balanced",
		top_k: 100,
		score_threshold: 0.5,
		rerank_top_n: 10,
		fusion_k: 30,
	},
	aggressive: {
		preset: "aggressive",
		top_k: 200,
		score_threshold: 0.3,
		rerank_top_n: 20,
		fusion_k: 20,
	},
	precision: {
		preset: "precision",
		top_k: 50,
		score_threshold: 0.8,
		rerank_top_n: 3,
		fusion_k: 50,
	},
};

async function applyPreset(name: string): Promise<void> {
	const config = presetMap[name];
	if (!config) return;
	const result = await commands.setVectorConfig(config);
	if (result.status === "ok") {
		retrievalConfig = config;
		await persistConfig(config);
	}
}

async function updateField(field: string, value: number): Promise<void> {
	if (!retrievalConfig) return;
	const updated: RetrievalConfig = {
		...retrievalConfig,
		[field]: value,
		preset: "custom",
	};
	const result = await commands.setVectorConfig(updated);
	if (result.status === "ok") {
		retrievalConfig = updated;
		await persistConfig(updated);
	}
}

function getFieldValue(field: string): number {
	if (!retrievalConfig) return 0;
	return (retrievalConfig as Record<string, unknown>)[field] as number;
}

function formatValue(field: string, value: number): string {
	if (field === "score_threshold") return value.toFixed(2);
	return String(value);
}

// ── Collection management state ─────────────────────────────
let newCollectionName = $state("");
let newCollectionDimension = $state(768);
let createLoading = $state(false);
let deleteConfirm = $state<string | null>(null);

async function createCollection(): Promise<void> {
	if (!newCollectionName.trim()) return;
	createLoading = true;
	const result = await commands.createVectorCollection(
		newCollectionName.trim(),
		newCollectionDimension,
	);
	if (result.status === "ok") {
		newCollectionName = "";
		await loadHealth();
	}
	createLoading = false;
}

async function deleteCollection(name: string): Promise<void> {
	if (deleteConfirm !== name) {
		deleteConfirm = name;
		return;
	}
	deleteConfirm = null;
	await commands.deleteVectorCollection(name);
	await loadHealth();
}

// Auto-reset delete confirm after 3s
$effect(() => {
	if (deleteConfirm) {
		const timer = setTimeout(() => (deleteConfirm = null), 3000);
		return () => clearTimeout(timer);
	}
});

// ── Encoder status state ────────────────────────────────────
let encoderSlot = $state<SlotInfo | null>(null);
let encoderError = $state<string | null>(null);

async function loadEncoderStatus(): Promise<void> {
	const result = await commands.getSlots();
	if (result.status === "ok") {
		encoderSlot = result.data.find((s: SlotInfo) => s.id === "rag.embedder") ?? null;
	} else {
		encoderError = result.error;
	}
}

// ── Search test bench state ─────────────────────────────────
let searchQuery = $state("");
let searchCollection = $state("");
let searchResults = $state<VectorSearchResult[]>([]);
let searchError = $state<string | null>(null);
let searchLoading = $state(false);
let embedLatencyMs = $state<number | null>(null);
let searchLatencyMs = $state<number | null>(null);

let collections = $derived<string[]>(
	healthReport ? healthReport.collections.map((c: CollectionInfo) => c.name) : [],
);

let scoreBuckets = $derived(() => {
	const buckets = [0, 0, 0, 0, 0];
	searchResults.forEach((r) => {
		const idx = Math.min(4, Math.floor(r.score * 5));
		buckets[idx]++;
	});
	return buckets;
});

const bucketColors = [
	"var(--signal-error)",
	"var(--color-amber-500)",
	"var(--signal-warning)",
	"var(--color-teal-600)",
	"var(--signal-success)",
];

async function runSearch(): Promise<void> {
	if (!searchQuery.trim() || !searchCollection) return;
	searchLoading = true;
	searchError = null;
	searchResults = [];
	embedLatencyMs = null;
	searchLatencyMs = null;

	const t0 = performance.now();
	const embedResult = await commands.embedText("rag.embedder", searchQuery);
	const t1 = performance.now();
	embedLatencyMs = Math.round(t1 - t0);

	if (embedResult.status !== "ok") {
		searchError = `Embed failed: ${embedResult.error}`;
		searchLoading = false;
		return;
	}

	const limit = retrievalConfig?.top_k ?? 10;
	const t2 = performance.now();
	const searchResult = await commands.vectorTestSearch(
		searchCollection,
		embedResult.data,
		Math.min(limit, 50),
	);
	const t3 = performance.now();
	searchLatencyMs = Math.round(t3 - t2);

	if (searchResult.status === "ok") {
		searchResults = searchResult.data;
	} else {
		searchError = searchResult.error;
	}
	searchLoading = false;
}

function scoreColor(score: number): string {
	if (score >= 0.8) return "var(--signal-success)";
	if (score >= 0.5) return "var(--signal-warning)";
	return "var(--signal-error)";
}

// ── Load on mount ───────────────────────────────────────────
$effect(() => {
	loadHealth();
	loadConfig();
	loadParamMeta();
	loadEncoderStatus();
});

$effect(() => {
	if (collections.length > 0 && !searchCollection) {
		searchCollection = collections[0];
	}
});
</script>

<div class="flex flex-col h-full bg-[var(--surface-base)] text-[var(--text-primary)]">
	<!-- Header -->
	<header class="px-4 pt-3 pb-2">
		<div class="flex items-center gap-2">
			<Compass size={18} class="text-[var(--color-teal-400)]" />
			<Text size="lg" weight="semibold">RRO / Vector Store</Text>
		</div>
		<Text size="xs" color="muted">
			Embedded vector search. Dense encoder (nomic-embed). Two-tier retrieval pipeline.
		</Text>
	</header>

	<!-- Tab bar -->
	<nav class="flex border-b border-[var(--border-subtle)] px-4">
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

	<!-- Tab content -->
	<main class="flex-1 overflow-y-auto p-4">

		<!-- CONFIG TAB -->
		{#if activeTab === "config"}
			<div class={stack({ gap: "4" })}>
				<!-- Preset buttons -->
				<div>
					<Text size="xs" weight="semibold" color="secondary">Presets</Text>
					<div class="grid grid-cols-4 gap-1.5 mt-2">
						{#each presets as p}
							<button
								class="px-2 py-1.5 text-xs rounded border transition-colors text-center
									{retrievalConfig?.preset === p.name
										? 'border-[var(--color-teal-400)] bg-[var(--color-teal-400)]/10 text-[var(--color-teal-400)]'
										: 'border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] text-[var(--text-secondary)]'}"
								onclick={() => applyPreset(p.name)}
							>
								{p.label}
							</button>
						{/each}
					</div>
					{#if retrievalConfig?.preset === "custom"}
						<div class="mt-1">
							<span class="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-amber-500)]/10 text-[var(--color-amber-500)]">
								Custom
							</span>
						</div>
					{/if}
				</div>

				<!-- Properties panel — sliders driven by param meta -->
				{#if paramMeta.length > 0 && retrievalConfig}
					<div>
						<Text size="xs" weight="semibold" color="secondary">Parameters</Text>
						<div class="mt-2 space-y-4">
							{#each paramMeta as param}
								<div class="space-y-1">
									<div class="flex items-center justify-between">
										<div>
											<Text size="xs" weight="semibold">{param.label}</Text>
											<Text size="xs" color="muted">{param.description}</Text>
										</div>
										<span class="font-mono text-xs text-[var(--color-teal-400)] min-w-[3rem] text-right">
											{formatValue(param.field, getFieldValue(param.field))}
										</span>
									</div>
									<Slider
										min={param.min}
										max={param.max}
										step={param.step}
										value={getFieldValue(param.field)}
										onValueChange={(v) => updateField(param.field, v)}
									/>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

		<!-- COLLECTIONS TAB -->
		{:else if activeTab === "collections"}
			<div class={stack({ gap: "4" })}>
				<!-- Health display -->
				<div class="flex items-center justify-between">
					<Text size="xs" weight="semibold" color="secondary">Collections</Text>
					<button
						class="p-1 rounded hover:bg-[var(--surface-raised)] transition-colors"
						onclick={loadHealth}
						title="Refresh"
					>
						{#if healthLoading}<Spinner size="xs" />{:else}<RefreshCw size={12} />{/if}
					</button>
				</div>

				{#if healthError}
					<Text size="xs" color="muted">{healthError}</Text>
				{:else if healthReport}
					<div class="text-xs mb-1">
						<span class="text-[var(--text-secondary)]">Storage:</span>
						<span class="font-mono ml-1">{healthReport.storage_path}</span>
					</div>

					{#if healthReport.collections.length === 0}
						<Text size="xs" color="muted">No collections yet. Create one below.</Text>
					{:else}
						<div class="space-y-1">
							{#each healthReport.collections as col}
								<div class="flex items-center justify-between px-2 py-1.5 rounded bg-[var(--surface-raised)] text-xs">
									<div class="flex items-center gap-2">
										<Database size={12} class="text-[var(--color-teal-400)]" />
										<span class="font-mono">{col.name}</span>
									</div>
									<div class="flex items-center gap-3">
										<span class="text-[var(--text-secondary)]">{col.point_count.toLocaleString()} pts</span>
										<button
											class="px-1.5 py-0.5 rounded text-[10px] transition-colors
												{deleteConfirm === col.name
													? 'bg-[var(--signal-error)]/20 text-[var(--signal-error)]'
													: 'hover:bg-[var(--signal-error)]/10 text-[var(--text-secondary)] hover:text-[var(--signal-error)]'}"
											onclick={() => deleteCollection(col.name)}
											title={deleteConfirm === col.name ? "Click again to confirm" : "Delete collection"}
										>
											{#if deleteConfirm === col.name}
												Confirm?
											{:else}
												<Trash2 size={10} />
											{/if}
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Create collection form -->
					<div class="mt-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
						<Text size="xs" weight="semibold" color="secondary">Create Collection</Text>
						<div class="flex gap-2 mt-2">
							<input
								type="text"
								class="flex-1 px-2 py-1 text-xs rounded bg-[var(--surface-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
								placeholder="Collection name..."
								bind:value={newCollectionName}
								onkeydown={(e: KeyboardEvent) => e.key === "Enter" && createCollection()}
							/>
							<input
								type="number"
								class="w-20 px-2 py-1 text-xs rounded bg-[var(--surface-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono"
								bind:value={newCollectionDimension}
								min={64}
								max={4096}
								title="Vector dimensions (768 for nomic-embed)"
							/>
							<Button preset="ghost" size="sm" onclick={createCollection} disabled={createLoading}>
								<Plus size={12} />
							</Button>
						</div>
						<Text size="xs" color="muted" class="mt-1">
							Default: 768 dims (nomic-embed-text-v1.5, cosine)
						</Text>
					</div>
				{:else}
					<Text size="xs" color="muted">Loading...</Text>
				{/if}
			</div>

		<!-- SEARCH TAB -->
		{:else if activeTab === "search"}
			<div class={stack({ gap: "3" })}>
				{#if !encoderSlot?.backend}
					<Text size="xs" color="muted">Load rag.embedder to enable search.</Text>
				{:else if collections.length === 0}
					<Text size="xs" color="muted">No collections available. Create one in the Collections tab.</Text>
				{:else}
					<div class={stack({ gap: "2" })}>
						<select
							class="w-full px-2 py-1 text-xs rounded bg-[var(--surface-base)] border border-[var(--border-subtle)] text-[var(--text-primary)]"
							bind:value={searchCollection}
						>
							{#each collections as col}
								<option value={col}>{col}</option>
							{/each}
						</select>

						<div class="flex gap-2">
							<input
								type="text"
								class="flex-1 px-2 py-1 text-xs rounded bg-[var(--surface-base)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
								placeholder="Search query..."
								bind:value={searchQuery}
								onkeydown={(e: KeyboardEvent) => e.key === "Enter" && runSearch()}
							/>
							<Button preset="ghost" size="sm" onclick={runSearch} disabled={searchLoading}>
								{searchLoading ? "..." : "Search"}
							</Button>
						</div>
					</div>

					{#if searchError}
						<Text size="xs" color="muted">{searchError}</Text>
					{/if}

					<!-- Results header with quality feedback -->
					{#if searchResults.length > 0}
						<div class="text-xs text-[var(--text-secondary)] space-y-1">
							<div>
								{searchResults.length} results
								{#if retrievalConfig}
									<span class="text-[var(--text-secondary)]">
										(depth={retrievalConfig.top_k}, floor={retrievalConfig.score_threshold.toFixed(2)})
									</span>
								{/if}
							</div>
							{#if embedLatencyMs !== null && searchLatencyMs !== null}
								<div class="font-mono">
									embed: {embedLatencyMs}ms &middot; search: {searchLatencyMs}ms &middot; total: {embedLatencyMs + searchLatencyMs}ms
								</div>
							{/if}

							<!-- Score distribution bar -->
							{#if searchResults.length > 0}
								<div class="flex h-2 rounded overflow-hidden gap-px mt-1">
									{#each scoreBuckets() as count, i}
										{#if count > 0}
											<div
												class="rounded-sm"
												style="flex-grow: {count}; background: {bucketColors[i]}; opacity: 0.7"
												title="{(i * 0.2).toFixed(1)}–{((i + 1) * 0.2).toFixed(1)}: {count} results"
											></div>
										{/if}
									{/each}
								</div>
								<div class="flex justify-between text-[10px] text-[var(--text-secondary)]">
									<span>0.0</span>
									<span>1.0</span>
								</div>
							{/if}
						</div>

						<!-- Results list -->
						<div class="space-y-1 max-h-64 overflow-y-auto">
							{#each searchResults as result}
								<div class="flex items-center gap-2 px-2 py-1 rounded bg-[var(--surface-raised)] text-xs">
									<div
										class="w-10 text-right font-mono font-medium shrink-0"
										style="color: {scoreColor(result.score)}"
									>
										{result.score.toFixed(3)}
									</div>
									<div class="flex-1 truncate font-mono text-[var(--text-secondary)]" title={result.payload_json}>
										{result.payload_json.slice(0, 100)}
									</div>
									<div class="text-[var(--text-secondary)] text-[10px] font-mono shrink-0">
										{result.id}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

		<!-- STATUS TAB -->
		{:else if activeTab === "status"}
			<div class={stack({ gap: "3" })}>
				<Text size="xs" weight="semibold" color="secondary">Encoder</Text>

				{#if encoderError}
					<Text size="xs" color="muted">{encoderError}</Text>
				{:else if encoderSlot}
					<div class="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
						<div class="text-xs space-y-1.5">
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Slot</span>
								<span class="font-mono">rag.embedder</span>
							</div>
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">Status</span>
								<span
									class="px-1.5 py-0.5 rounded text-[10px] font-medium"
									style="background: {encoderSlot.backend ? 'var(--signal-success)' : 'var(--signal-error)'}20; color: {encoderSlot.backend ? 'var(--signal-success)' : 'var(--signal-error)'}"
								>
									{encoderSlot.backend ? "Loaded" : "Unloaded"}
								</span>
							</div>
							{#if encoderSlot.assigned_model_id}
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Model</span>
									<span class="font-mono truncate max-w-[200px]" title={encoderSlot.assigned_model_id}>
										{encoderSlot.assigned_model_id}
									</span>
								</div>
							{/if}
							{#if encoderSlot.backend}
								<div class="flex justify-between">
									<span class="text-[var(--text-secondary)]">Backend</span>
									<span class="font-mono">{encoderSlot.backend}</span>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<Text size="xs" color="muted">rag.embedder slot not found.</Text>
				{/if}

				<Text size="xs" weight="semibold" color="secondary">Health</Text>

				{#if healthReport}
					<div class="p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)] text-xs space-y-1">
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Storage</span>
							<span class="font-mono truncate max-w-[200px]">{healthReport.storage_path}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Collections</span>
							<span>{healthReport.collections.length}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Total points</span>
							<span>{healthReport.collections.reduce((sum: number, c: CollectionInfo) => sum + Number(c.point_count), 0).toLocaleString()}</span>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</main>
</div>
