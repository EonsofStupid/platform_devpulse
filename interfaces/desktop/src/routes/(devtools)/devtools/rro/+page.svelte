<!--
	@file /devtools/rro — Search configuration devtool
	@route /devtools/rro
	@window DevTools (Ctrl+Shift+Z)

	Layman-friendly UI for managing the vector store, encoder, and
	retrieval tuning. All components are ColdLight.
-->
<script lang="ts">
import {
	ArrowLeft,
	Compass,
	Database,
	Plus,
	RefreshCw,
	Search,
	Settings2,
	Shapes,
	Trash2,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Callout } from "$lib/design/components/callout/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { NumberField } from "$lib/design/components/number-field/index.js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "$lib/design/components/select/index.js";
import { Slider } from "$lib/design/components/slider/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { StatusDot } from "$lib/design/components/status-dot/index.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/design/components/tabs/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import type {
	CollectionInfo,
	RetrievalConfig,
	RetrievalParamMeta,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { withRetry } from "$lib/sys/retry.js";

// ── Error surfaces (per-panel, bubble real messages to UI) ──
function describeError(e: unknown): string {
	if (e instanceof Error) return e.message;
	return typeof e === "string" ? e : JSON.stringify(e);
}

// ── Tab state ───────────────────────────────────────────────
type TabId = "search" | "tuning" | "collections" | "encoder";
let activeTab = $state<TabId>("search");

// ── Health state ────────────────────────────────────────────
let healthReport = $state<VectorHealthReport | null>(null);
let healthError = $state<string | null>(null);
let healthLoading = $state(false);

async function loadHealth(): Promise<void> {
	healthLoading = true;
	healthError = null;
	try {
		healthReport = await withAction("rro.loadHealth", "Loading store health…", () =>
			withRetry(
				async () => {
					const r = await commands.getVectorHealth();
					if (r.status !== "ok") throw new Error(r.error);
					return r.data;
				},
				{ label: "rro.loadHealth" },
			),
		);
	} catch (e) {
		healthError = describeError(e);
		logError("rro", `loadHealth failed after retries: ${healthError}`);
	} finally {
		healthLoading = false;
	}
}

// ── Param meta (layman labels from Rust) ────────────────────
let paramMeta = $state<RetrievalParamMeta[]>([]);

async function loadParamMeta(): Promise<void> {
	try {
		paramMeta = await withAction("rro.loadParamMeta", "Loading tuning parameters…", () =>
			withRetry(
				async () => {
					const r = await commands.getRetrievalParamMeta();
					if (r.status !== "ok") throw new Error(r.error);
					return r.data;
				},
				{ label: "rro.loadParamMeta" },
			),
		);
	} catch (e) {
		logError("rro", `loadParamMeta failed: ${describeError(e)}`);
	}
}

// ── Retrieval config state ──────────────────────────────────
let retrievalConfig = $state<RetrievalConfig | null>(null);
let configError = $state<string | null>(null);

async function loadConfig(): Promise<void> {
	try {
		await withAction("rro.loadConfig", "Loading search tuning…", async () => {
			// Try persisted preference first (idempotent read with retry).
			const persisted = await withRetry(
				async () => {
					const r = await commands.getPreference("rro:retrieval_config");
					if (r.status !== "ok") throw new Error(r.error);
					return r.data;
				},
				{ label: "rro.loadConfig.getPreference" },
			);

			if (persisted) {
				try {
					const saved = JSON.parse(persisted) as RetrievalConfig;
					const setResult = await commands.setVectorConfig(saved);
					if (setResult.status === "ok") {
						retrievalConfig = saved;
						logInfo("rro", `restored persisted config: preset=${saved.preset}`);
						return;
					}
					logError("rro", `setVectorConfig from persisted failed: ${setResult.error}`);
				} catch (parseErr) {
					logError("rro", `persisted config parse failed: ${describeError(parseErr)}`);
				}
			}

			// Fallback: runtime default (idempotent read with retry).
			retrievalConfig = await withRetry(
				async () => {
					const r = await commands.getVectorConfig();
					if (r.status !== "ok") throw new Error(r.error);
					return r.data;
				},
				{ label: "rro.loadConfig.getVectorConfig" },
			);
		});
	} catch (e) {
		configError = describeError(e);
		logError("rro", `loadConfig failed: ${configError}`);
	}
}

async function persistConfig(config: RetrievalConfig): Promise<void> {
	try {
		const r = await commands.setPreference("rro:retrieval_config", JSON.stringify(config));
		if (r.status !== "ok") throw new Error(r.error);
	} catch (e) {
		logError("rro", `persistConfig failed: ${describeError(e)}`);
	}
}

const presets = [
	{ name: "conservative", label: "Focused", desc: "Fewer, higher-quality results" },
	{ name: "balanced", label: "Balanced", desc: "Default — good for most queries" },
	{ name: "aggressive", label: "Wide", desc: "More results, broader matches" },
	{ name: "precision", label: "Precise", desc: "Tightest filter, few results" },
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
	try {
		await withAction("rro.applyPreset", `Switching to "${name}" preset…`, async () => {
			const r = await commands.setVectorConfig(config);
			if (r.status !== "ok") throw new Error(r.error);
		});
		retrievalConfig = config;
		await persistConfig(config);
	} catch (e) {
		configError = describeError(e);
		logError("rro", `applyPreset(${name}) failed: ${configError}`);
	}
}

async function updateField(field: string, value: number): Promise<void> {
	if (!retrievalConfig) return;
	const updated: RetrievalConfig = {
		...retrievalConfig,
		[field]: value,
		preset: "custom",
	};
	try {
		await withAction("rro.updateField", `Adjusting ${field}…`, async () => {
			const r = await commands.setVectorConfig(updated);
			if (r.status !== "ok") throw new Error(r.error);
		});
		retrievalConfig = updated;
		await persistConfig(updated);
	} catch (e) {
		configError = describeError(e);
		logError("rro", `updateField(${field}=${value}) failed: ${configError}`);
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

let createError = $state<string | null>(null);
let deleteError = $state<string | null>(null);

async function createCollection(): Promise<void> {
	const name = newCollectionName.trim();
	if (!name) return;
	createError = null;
	createLoading = true;
	try {
		await withAction("rro.createCollection", `Creating store "${name}"…`, async () => {
			const r = await commands.createVectorCollection(name, newCollectionDimension);
			if (r.status !== "ok") throw new Error(r.error);
		});
		newCollectionName = "";
		await loadHealth();
	} catch (e) {
		createError = describeError(e);
		logError("rro", `createCollection(${name}) failed: ${createError}`);
	} finally {
		createLoading = false;
	}
}

async function deleteCollection(name: string): Promise<void> {
	if (deleteConfirm !== name) {
		deleteConfirm = name;
		return;
	}
	deleteConfirm = null;
	deleteError = null;
	try {
		await withAction("rro.deleteCollection", `Deleting store "${name}"…`, async () => {
			const r = await commands.deleteVectorCollection(name);
			if (r.status !== "ok") throw new Error(r.error);
		});
		await loadHealth();
	} catch (e) {
		deleteError = describeError(e);
		logError("rro", `deleteCollection(${name}) failed: ${deleteError}`);
	}
}

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
	try {
		const slots = await withAction("rro.loadEncoderStatus", "Checking encoder status…", () =>
			withRetry(
				async () => {
					const r = await commands.getSlots();
					if (r.status !== "ok") throw new Error(r.error);
					return r.data;
				},
				{ label: "rro.loadEncoderStatus" },
			),
		);
		encoderSlot = slots.find((s: SlotInfo) => s.id === "rag.embedder") ?? null;
	} catch (e) {
		encoderError = describeError(e);
		logError("rro", `loadEncoderStatus failed: ${encoderError}`);
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

async function runSearch(): Promise<void> {
	const q = searchQuery.trim();
	if (!q || !searchCollection) return;
	searchLoading = true;
	searchError = null;
	searchResults = [];
	embedLatencyMs = null;
	searchLatencyMs = null;

	try {
		// Step 1: encode query (no retry — cheap but not strictly idempotent under load)
		const t0 = performance.now();
		const vector = await withAction("rro.embedQuery", "Encoding your query…", async () => {
			const r = await commands.embedText("rag.embedder", q);
			if (r.status !== "ok") throw new Error(r.error);
			return r.data;
		});
		const embedMs = Math.round(performance.now() - t0);
		embedLatencyMs = embedMs;

		// Step 2: search (no retry — results would be deterministic on retry but we log once)
		const limit = retrievalConfig?.top_k ?? 10;
		const t2 = performance.now();
		const results = await withAction(
			"rro.testSearch",
			`Searching "${searchCollection}"…`,
			async () => {
				const r = await commands.vectorTestSearch(searchCollection, vector, Math.min(limit, 50));
				if (r.status !== "ok") throw new Error(r.error);
				return r.data;
			},
		);
		const searchMs = Math.round(performance.now() - t2);
		searchLatencyMs = searchMs;
		searchResults = results;
		logInfo("rro", `search returned ${results.length} matches in ${embedMs + searchMs}ms`);
	} catch (e) {
		searchError = describeError(e);
		logError("rro", `runSearch failed: ${searchError}`);
	} finally {
		searchLoading = false;
	}
}

// Score → semantic variant for Badge color
function scoreVariant(score: number): "positive" | "notice" | "negative" {
	if (score >= 0.8) return "positive";
	if (score >= 0.5) return "notice";
	return "negative";
}

// Score → StatusDot tone for distribution bar
function bucketTone(idx: number): "error" | "warning" | "neutral" | "accent" | "success" {
	const tones: ("error" | "warning" | "neutral" | "accent" | "success")[] = [
		"error",
		"warning",
		"neutral",
		"accent",
		"success",
	];
	return tones[idx];
}

// Score bucket → Tailwind background class (uses ColdLight tokens via arbitrary values)
function bucketBgClass(idx: number): string {
	const classes = [
		"bg-[var(--signal-error)]",
		"bg-[var(--color-amber-500)]",
		"bg-[var(--signal-warning)]",
		"bg-[var(--color-teal-600)]",
		"bg-[var(--signal-success)]",
	];
	return classes[idx] ?? classes[2];
}

// ── Load on mount ───────────────────────────────────────────
$effect(() => {
	logInfo("rro", "devtool mounted");
	// Fire-and-forget — each loader catches its own errors.
	void loadHealth();
	void loadConfig();
	void loadParamMeta();
	void loadEncoderStatus();
});

$effect(() => {
	if (collections.length > 0 && !searchCollection) {
		searchCollection = collections[0];
	}
});
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<header class="flex items-center gap-3 h-10 px-4 border-b border-[var(--border-subtle)]">
		<a href="/devtools" class="hover:text-[var(--color-teal-400)]">
			<ArrowLeft size={14} />
		</a>
		<Compass size={16} class="text-[var(--color-teal-400)]" />
		<Text size="sm" weight="semibold">Search Tuning</Text>
		<Text size="xs">How Clyffy finds things in your stored knowledge.</Text>
	</header>

	<!-- Tabs -->
	<Tabs value={activeTab} onValueChange={(v) => (activeTab = v as TabId)} preset="default">
		<TabsList class="flex border-b border-[var(--border-subtle)]">
			<TabsTrigger value="search" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Search size={14} /> Try It
			</TabsTrigger>
			<TabsTrigger value="tuning" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Settings2 size={14} /> Tuning
			</TabsTrigger>
			<TabsTrigger value="collections" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Database size={14} /> Knowledge Stores
			</TabsTrigger>
			<TabsTrigger value="encoder" class="flex items-center gap-1.5 px-3 py-2 text-xs">
				<Shapes size={14} /> Encoder
			</TabsTrigger>
		</TabsList>

		<!-- ═══════ SEARCH (TRY IT) ═══════ -->
		<TabsContent value="search" class="flex-1 overflow-y-auto p-4 space-y-3">
			<Card preset="glass">
				<div class="p-3 space-y-3">
					<div class="flex items-center gap-2">
						<Search size={14} class="text-[var(--color-teal-400)]" />
						<Text size="sm" weight="semibold">Ask a question</Text>
					</div>
					<Text size="xs" preset="flat">
						Type a question and see what matches. Results come from the selected knowledge store.
					</Text>

					{#if !encoderSlot?.backend}
						<Text size="xs" preset="stark">Load the encoder first (Encoder tab).</Text>
					{:else if collections.length === 0}
						<Text size="xs" preset="stark">No knowledge stores yet. Create one in the Knowledge Stores tab.</Text>
					{:else}
						<div class="space-y-2">
							<Select value={searchCollection} onValueChange={(v) => (searchCollection = v)}>
								<SelectTrigger class="w-full px-3 py-1.5 text-xs rounded border border-[var(--border-subtle)] bg-[var(--surface-base)] text-left">
									{searchCollection || "Select a store..."}
								</SelectTrigger>
								<SelectContent>
									{#each collections as col}
										<SelectItem value={col}>{col}</SelectItem>
									{/each}
								</SelectContent>
							</Select>

							<div class="flex gap-2">
								<div class="flex-1">
									<TextField
										value={searchQuery}
										onValueChange={(v) => (searchQuery = v)}
										placeholder="What do you want to find?"
										size="sm"
										aria-label="Search query"
									/>
								</div>
								<Button preset="primary" size="sm" onclick={runSearch} disabled={searchLoading}>
									{searchLoading ? "Searching..." : "Search"}
								</Button>
							</div>
						</div>

						{#if searchError}
							<Callout variant="error" preset="flat">
								<Text size="xs">Search failed: {searchError}</Text>
							</Callout>
						{/if}

						{#if searchResults.length > 0}
							<!-- Quality feedback -->
							<div class="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
								<div class="flex items-center gap-2 flex-wrap">
									<Badge variant="accent" size="sm" fillStyle="subtle">
										{searchResults.length} matches
									</Badge>
									{#if retrievalConfig}
										<Badge variant="neutral" size="sm" fillStyle="outline">
											Depth {retrievalConfig.top_k}
										</Badge>
										<Badge variant="neutral" size="sm" fillStyle="outline">
											Floor {retrievalConfig.score_threshold.toFixed(2)}
										</Badge>
									{/if}
									{#if embedLatencyMs !== null && searchLatencyMs !== null}
										<Badge variant="informative" size="sm" fillStyle="subtle">
											{embedLatencyMs + searchLatencyMs}ms total
										</Badge>
									{/if}
								</div>

								<!-- Score distribution -->
								<div class="space-y-0.5">
									<div class="flex h-1.5 rounded overflow-hidden gap-px">
										{#each scoreBuckets() as count, i}
											{#if count > 0}
												<div
													class="rounded-sm opacity-80 {bucketBgClass(i)}"
													style:flex-grow={count}
												></div>
											{/if}
										{/each}
									</div>
									<div class="flex justify-between">
										<Text size="xs" preset="flat">Weak</Text>
										<Text size="xs" preset="flat">Strong</Text>
									</div>
								</div>
							</div>

							<!-- Results list -->
							<div class="space-y-1 max-h-80 overflow-y-auto">
								{#each searchResults as result}
									<Card preset="flat">
										<div class="flex items-center gap-2 p-2">
											<Badge
												variant={scoreVariant(result.score)}
												size="sm"
												fillStyle="bold"
											>
												{result.score.toFixed(2)}
											</Badge>
											<div class="flex-1 truncate">
												<Text size="xs" preset="flat">
													{result.payload_json.slice(0, 120) || "(no content)"}
												</Text>
											</div>
											<Text size="xs" preset="flat">{result.id}</Text>
										</div>
									</Card>
								{/each}
							</div>
						{/if}
					{/if}
				</div>
			</Card>
		</TabsContent>

		<!-- ═══════ TUNING ═══════ -->
		<TabsContent value="tuning" class="flex-1 overflow-y-auto p-4 space-y-3">
			{#if configError}
				<Callout variant="error" preset="flat">
					<Text size="xs">Tuning error: {configError}</Text>
				</Callout>
			{/if}
			<!-- Presets -->
			<Card preset="glass">
				<div class="p-3 space-y-3">
					<div class="flex items-center gap-2">
						<Settings2 size={14} class="text-[var(--color-teal-400)]" />
						<Text size="sm" weight="semibold">Quick presets</Text>
						{#if retrievalConfig?.preset === "custom"}
							<Badge variant="notice" size="sm" fillStyle="subtle">Custom</Badge>
						{/if}
					</div>
					<Text size="xs" preset="flat">
						Start with a preset, or adjust the sliders below for fine control.
					</Text>

					<div class="grid grid-cols-2 gap-2">
						{#each presets as p}
							<Button
								preset={retrievalConfig?.preset === p.name ? "primary" : "secondary"}
								size="sm"
								onclick={() => applyPreset(p.name)}
							>
								<div class="text-left w-full">
									<div class="font-medium">{p.label}</div>
									<div class="text-xs opacity-80">{p.desc}</div>
								</div>
							</Button>
						{/each}
					</div>
				</div>
			</Card>

			<!-- Fine-grained sliders -->
			{#if paramMeta.length > 0 && retrievalConfig}
				<Card preset="glass">
					<div class="p-3 space-y-4">
						<div class="flex items-center gap-2">
							<Text size="sm" weight="semibold">Fine-tune</Text>
						</div>
						{#each paramMeta as param}
							<div class="space-y-2">
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1">
										<Text size="sm" weight="medium">{param.label}</Text>
										<Text size="xs" preset="flat">{param.description}</Text>
									</div>
									<Badge variant="accent" size="sm" fillStyle="outline">
										{formatValue(param.field, getFieldValue(param.field))}
									</Badge>
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
				</Card>
			{/if}
		</TabsContent>

		<!-- ═══════ COLLECTIONS (KNOWLEDGE STORES) ═══════ -->
		<TabsContent value="collections" class="flex-1 overflow-y-auto p-4 space-y-3">
			<Card preset="glass">
				<div class="p-3 space-y-3">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<Database size={14} class="text-[var(--color-teal-400)]" />
							<Text size="sm" weight="semibold">Your stores</Text>
						</div>
						<Button preset="ghost" size="sm" onclick={loadHealth} disabled={healthLoading}>
							{#if healthLoading}
								<Spinner size="xs" />
							{:else}
								<RefreshCw size={12} />
							{/if}
						</Button>
					</div>

					{#if healthError}
						<Callout variant="error" preset="flat">
							<Text size="xs">Couldn't load stores: {healthError}</Text>
						</Callout>
					{:else if healthReport}
						<div class="text-xs">
							<Text size="xs" preset="flat">Saved at:</Text>
							<Text size="xs" weight="medium">{healthReport.storage_path}</Text>
						</div>

						{#if healthReport.collections.length === 0}
							<Text size="xs" preset="flat">No stores yet. Create one below.</Text>
						{:else}
							<div class="space-y-1.5">
								{#each healthReport.collections as col}
									<Card preset="flat">
										<div class="flex items-center justify-between p-2 gap-2">
											<div class="flex items-center gap-2 min-w-0">
												<Database size={12} class="text-[var(--color-teal-400)] shrink-0" />
												<Text size="sm" weight="medium">{col.name}</Text>
											</div>
											<div class="flex items-center gap-2">
												<Badge variant="informative" size="sm" fillStyle="subtle">
													{col.point_count.toLocaleString()} items
												</Badge>
												<Button
													preset={deleteConfirm === col.name ? "danger" : "ghost"}
													size="sm"
													onclick={() => deleteCollection(col.name)}
												>
													{#if deleteConfirm === col.name}
														Confirm delete
													{:else}
														<Trash2 size={12} />
													{/if}
												</Button>
											</div>
										</div>
									</Card>
								{/each}
							</div>
						{/if}
					{:else}
						<Text size="xs" preset="flat">Loading...</Text>
					{/if}
				</div>
			</Card>

			<!-- Create collection -->
			<Card preset="glass">
				<div class="p-3 space-y-3">
					<div class="flex items-center gap-2">
						<Plus size={14} class="text-[var(--color-teal-400)]" />
						<Text size="sm" weight="semibold">Add a new store</Text>
					</div>
					<Text size="xs" preset="flat">
						A store holds a set of searchable items (documents, code snippets, notes).
					</Text>

					<div class="space-y-2">
						<TextField
							value={newCollectionName}
							onValueChange={(v) => (newCollectionName = v)}
							label="Store name"
							placeholder="e.g. docs, code, notes"
							size="sm"
						/>
						<NumberField
							value={newCollectionDimension}
							onValueChange={(v) => (newCollectionDimension = v)}
							min={64}
							max={4096}
							step={1}
							size="sm"
							aria-label="Vector dimensions"
						/>
						<Text size="xs" preset="flat">
							Dimension should match your encoder. 768 works for nomic-embed.
						</Text>
						{#if createError}
							<Callout variant="error" preset="flat">
								<Text size="xs">Couldn't create store: {createError}</Text>
							</Callout>
						{/if}
						{#if deleteError}
							<Callout variant="error" preset="flat">
								<Text size="xs">Couldn't delete store: {deleteError}</Text>
							</Callout>
						{/if}
						<Button
							preset="primary"
							size="sm"
							onclick={createCollection}
							disabled={createLoading || !newCollectionName.trim()}
						>
							<Plus size={12} />
							Create store
						</Button>
					</div>
				</div>
			</Card>
		</TabsContent>

		<!-- ═══════ ENCODER ═══════ -->
		<TabsContent value="encoder" class="flex-1 overflow-y-auto p-4 space-y-3">
			<Card preset="glass">
				<div class="p-3 space-y-3">
					<div class="flex items-center gap-2">
						<Shapes size={14} class="text-[var(--color-teal-400)]" />
						<Text size="sm" weight="semibold">Encoder status</Text>
					</div>
					<Text size="xs" preset="flat">
						The encoder turns your text into searchable vectors.
					</Text>

					{#if encoderError}
						<Callout variant="error" preset="flat">
							<Text size="xs">Encoder check failed: {encoderError}</Text>
						</Callout>
					{:else if encoderSlot}
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Text size="xs" preset="flat">Slot</Text>
								<Text size="xs" weight="medium">rag.embedder</Text>
							</div>
							<div class="flex items-center justify-between">
								<Text size="xs" preset="flat">Status</Text>
								{#if encoderSlot.backend}
									<Badge variant="positive" size="sm" fillStyle="subtle">
										<StatusDot tone="success" /> Ready
									</Badge>
								{:else}
									<Badge variant="negative" size="sm" fillStyle="subtle">
										<StatusDot tone="error" /> Not loaded
									</Badge>
								{/if}
							</div>
							{#if encoderSlot.assigned_model_id}
								<div class="flex items-center justify-between gap-2">
									<Text size="xs" preset="flat">Model</Text>
									<Text size="xs" weight="medium">{encoderSlot.assigned_model_id}</Text>
								</div>
							{/if}
							{#if encoderSlot.backend}
								<div class="flex items-center justify-between">
									<Text size="xs" preset="flat">Engine</Text>
									<Text size="xs" weight="medium">{encoderSlot.backend}</Text>
								</div>
							{/if}
						</div>
					{:else}
						<Text size="xs" preset="flat">Encoder slot not found.</Text>
					{/if}
				</div>
			</Card>

			{#if healthReport}
				<Card preset="glass">
					<div class="p-3 space-y-2">
						<Text size="sm" weight="semibold">Overview</Text>
						<div class="flex items-center justify-between">
							<Text size="xs" preset="flat">Stores</Text>
							<Text size="xs" weight="medium">{healthReport.collections.length}</Text>
						</div>
						<div class="flex items-center justify-between">
							<Text size="xs" preset="flat">Total items</Text>
							<Text size="xs" weight="medium">
								{healthReport.collections.reduce((sum: number, c: CollectionInfo) => sum + Number(c.point_count), 0).toLocaleString()}
							</Text>
						</div>
					</div>
				</Card>
			{/if}
		</TabsContent>
	</Tabs>
</div>
