<!--
	@file /devtools/rro — RRO vector store devtool
	@route /devtools/rro
	@window DevTools (Ctrl+Shift+Z)

	Vector store administration: collection health, retrieval config,
	baseline preset switching, search test bench.
-->
<script lang="ts">
import { Compass, HeartPulse, RefreshCw, Search, Settings2, Shapes } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type {
	CollectionInfo,
	RetrievalConfig,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";

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

// ── Retrieval config state ──────────────────────────────────
let retrievalConfig = $state<RetrievalConfig | null>(null);
let configError = $state<string | null>(null);

async function loadConfig(): Promise<void> {
	const result = await commands.getVectorConfig();
	if (result.status === "ok") {
		retrievalConfig = result.data;
	} else {
		configError = result.error;
	}
}

const presets = [
	{ name: "conservative", label: "Conservative", desc: "k=20 thr=0.75 rerank=5" },
	{ name: "balanced", label: "Balanced", desc: "k=50 thr=0.60 rerank=10" },
	{ name: "aggressive", label: "Aggressive", desc: "k=100 thr=0.40 rerank=20" },
	{ name: "precision", label: "Precision", desc: "k=30 thr=0.80 rerank=3" },
] as const;

async function applyPreset(name: string): Promise<void> {
	const presetMap: Record<string, RetrievalConfig> = {
		conservative: { preset: "conservative", top_k: 20, score_threshold: 0.75, rerank_top_n: 5 },
		balanced: { preset: "balanced", top_k: 50, score_threshold: 0.6, rerank_top_n: 10 },
		aggressive: { preset: "aggressive", top_k: 100, score_threshold: 0.4, rerank_top_n: 20 },
		precision: { preset: "precision", top_k: 30, score_threshold: 0.8, rerank_top_n: 3 },
	};
	const config = presetMap[name];
	if (!config) return;
	const result = await commands.setVectorConfig(config);
	if (result.status === "ok") {
		retrievalConfig = config;
	}
}

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

let collections = $derived<string[]>(
	healthReport ? healthReport.collections.map((c: CollectionInfo) => c.name) : [],
);

async function runSearch(): Promise<void> {
	if (!searchQuery.trim() || !searchCollection) return;
	searchLoading = true;
	searchError = null;
	searchResults = [];

	// Step 1: embed the query text
	const embedResult = await commands.embedText("rag.embedder", searchQuery);
	if (embedResult.status !== "ok") {
		searchError = `Embed failed: ${embedResult.error}`;
		searchLoading = false;
		return;
	}

	// Step 2: search with the vector
	const limit = retrievalConfig?.top_k ?? 10;
	const searchResult = await commands.vectorTestSearch(
		searchCollection,
		embedResult.data,
		Math.min(limit, 20),
	);
	if (searchResult.status === "ok") {
		searchResults = searchResult.data;
	} else {
		searchError = searchResult.error;
	}
	searchLoading = false;
}

// ── Load on mount ───────────────────────────────────────────
$effect(() => {
	loadHealth();
	loadConfig();
	loadEncoderStatus();
});

// ── Auto-select first collection when health loads ──────────
$effect(() => {
	if (collections.length > 0 && !searchCollection) {
		searchCollection = collections[0];
	}
});

// ── Score color helper ──────────────────────────────────────
function scoreColor(score: number): string {
	if (score >= 0.8) return "var(--signal-success)";
	if (score >= 0.5) return "var(--signal-warning)";
	return "var(--signal-error)";
}
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<!-- Header -->
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Compass size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">RRO / Vector Store</Text>
			</div>
			<Text size="xs" color="muted">
				Embedded vector search. Dense encoder (nomic-embed). Two-tier retrieval pipeline.
			</Text>
		</header>

		<!-- Card grid -->
		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">

			<!-- Collection Health -->
			<div class="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<HeartPulse size={16} class="text-[var(--color-teal-400)]" />
						<Text size="sm" weight="semibold">Collection health</Text>
					</div>
					<button
						class="p-1 rounded hover:bg-[var(--surface-base)] transition-colors"
						onclick={loadHealth}
						title="Refresh"
					>
						{#if healthLoading}<Spinner size="xs" />{:else}<RefreshCw size={12} />{/if}
					</button>
				</div>

				{#if healthError}
					<Text size="xs" color="muted">{healthError}</Text>
				{:else if healthReport}
					<div class="space-y-1 text-xs">
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Data directory</span>
							<span class="font-mono truncate max-w-[200px]" title={healthReport.storage_path}>
								{healthReport.storage_path}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-[var(--text-secondary)]">Collections</span>
							<span>{healthReport.collections.length}</span>
						</div>
						{#each healthReport.collections as col}
							<div class="flex justify-between pl-3">
								<span class="text-[var(--text-secondary)] font-mono">{col.name}</span>
								<span>{col.point_count.toLocaleString()} pts</span>
							</div>
						{/each}
						{#if healthReport.collections.length === 0}
							<Text size="xs" color="muted">No collections yet.</Text>
						{/if}
					</div>
				{:else}
					<Text size="xs" color="muted">Loading...</Text>
				{/if}
			</div>

			<!-- Baseline Presets -->
			<div class="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
				<div class="flex items-center gap-2">
					<Settings2 size={16} class="text-[var(--color-teal-400)]" />
					<Text size="sm" weight="semibold">Baseline presets</Text>
				</div>

				{#if configError}
					<Text size="xs" color="muted">{configError}</Text>
				{:else}
					<div class="grid grid-cols-2 gap-1.5">
						{#each presets as p}
							<button
								class="px-2 py-1.5 text-xs rounded border transition-colors text-left
									{retrievalConfig?.preset === p.name
										? 'border-[var(--color-teal-400)] bg-[var(--color-teal-400)]/10 text-[var(--color-teal-400)]'
										: 'border-[var(--border-subtle)] hover:border-[var(--color-teal-600)] text-[var(--text-secondary)]'}"
								onclick={() => applyPreset(p.name)}
							>
								<div class="font-medium">{p.label}</div>
								<div class="text-[10px] opacity-70">{p.desc}</div>
							</button>
						{/each}
					</div>

					{#if retrievalConfig}
						<div class="text-xs space-y-0.5 mt-1 px-1">
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">top_k</span>
								<span class="font-mono">{retrievalConfig.top_k}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">score_threshold</span>
								<span class="font-mono">{retrievalConfig.score_threshold.toFixed(2)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-[var(--text-secondary)]">rerank_top_n</span>
								<span class="font-mono">{retrievalConfig.rerank_top_n}</span>
							</div>
						</div>
					{/if}
				{/if}
			</div>

			<!-- Encoder Status -->
			<div class="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
				<div class="flex items-center gap-2">
					<Shapes size={16} class="text-[var(--color-teal-400)]" />
					<Text size="sm" weight="semibold">Encoder status</Text>
				</div>

				{#if encoderError}
					<Text size="xs" color="muted">{encoderError}</Text>
				{:else if encoderSlot}
					<div class="text-xs space-y-1">
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
								<span class="font-mono truncate max-w-[180px]" title={encoderSlot.assigned_model_id}>
									{encoderSlot.assigned_model_id}
								</span>
							</div>
						{/if}
					</div>
				{:else}
					<Text size="xs" color="muted">rag.embedder slot not found.</Text>
				{/if}
			</div>

			<!-- Search Test Bench -->
			<div class="flex flex-col gap-2 p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
				<div class="flex items-center gap-2">
					<Search size={16} class="text-[var(--color-teal-400)]" />
					<Text size="sm" weight="semibold">Search test bench</Text>
				</div>

				{#if !encoderSlot?.backend}
					<Text size="xs" color="muted">Load rag.embedder to enable search.</Text>
				{:else if collections.length === 0}
					<Text size="xs" color="muted">No collections available.</Text>
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

					{#if searchResults.length > 0}
						<div class="space-y-1 max-h-48 overflow-y-auto">
							{#each searchResults as result}
								<div class="flex items-center gap-2 px-2 py-1 rounded bg-[var(--surface-base)] text-xs">
									<div
										class="w-10 text-right font-mono font-medium"
										style="color: {scoreColor(result.score)}"
									>
										{result.score.toFixed(3)}
									</div>
									<div class="flex-1 truncate font-mono text-[var(--text-secondary)]" title={result.payload_json}>
										{result.payload_json.slice(0, 80)}
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

		</section>
	</div>
</div>
