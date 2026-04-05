<!--
  @file MemoryCard — "How much Clyffy remembers" card for the consumer model loader.
  RAG pipeline shown as unified "memory" system. Depth slider. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Brain, Download, Loader2, Power } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { getCatalogForSlot } from "../services/catalog.service.js";
import { downloadModel, onDownloadProgress } from "../services/download.service.js";
import { formatMb } from "../types/models.types.js";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	/** Whether advanced (dev) view is active. */
	advanced?: boolean;
}

let { advanced = false }: Props = $props();

// ── Catalog from Rust TOML ───────────────────────────────────

const EMBEDDER_SLOT = "rag.embedder";
const RERANKER_SLOT = "rag.reranker";

let embedRepo = $state("");
let embedFile = $state("");
let embedSizeMb = $state(0);
let rerankRepo = $state("");
let rerankFile = $state("");
let rerankSizeMb = $state(0);

$effect(() => {
	getCatalogForSlot(EMBEDDER_SLOT).then((entry) => {
		if (entry && entry.options.length > 0) {
			embedRepo = entry.options[0].repo;
			embedFile = entry.options[0].file;
			embedSizeMb = entry.options[0].size_mb;
		}
	});
	getCatalogForSlot(RERANKER_SLOT).then((entry) => {
		if (entry && entry.options.length > 0) {
			rerankRepo = entry.options[0].repo;
			rerankFile = entry.options[0].file;
			rerankSizeMb = entry.options[0].size_mb;
		}
	});
});

// ── State ─────────────────────────────────────────────────────

let downloadingEmbed = $state(false);
let downloadingRerank = $state(false);
let embedPct = $state(0);
let rerankPct = $state(0);
let memoryDepth = $state(5); // Maps to retrieval top-k
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

function slotStatus(
	slotId: string,
): "not_downloaded" | "downloaded" | "loading" | "loaded" | "error" {
	const status = modelsState.statuses[slotId];
	if (!status) {
		const slot = modelsState.slots.find((s) => s.id === slotId);
		if (slot?.assigned_model_id) return "downloaded";
		return "not_downloaded";
	}
	return status.type === "not_loaded"
		? "downloaded"
		: (status.type as "loading" | "loaded" | "error");
}

const embedStatus = $derived(slotStatus(EMBEDDER_SLOT));
const rerankStatus = $derived(slotStatus(RERANKER_SLOT));
const memoryReady = $derived(
	(embedStatus === "loaded" || embedStatus === "downloaded") &&
		(rerankStatus === "loaded" || rerankStatus === "downloaded"),
);
const bothInstalled = $derived(
	embedStatus !== "not_downloaded" && rerankStatus !== "not_downloaded",
);

const depthLabels: Record<number, string> = {
	1: "Minimal — remembers very little",
	3: "Light — recent conversations",
	5: "Balanced — good memory (default)",
	7: "Deep — extensive recall",
	10: "Maximum — remembers everything",
};

const depthLabel = $derived(depthLabels[memoryDepth] ?? `Custom depth: ${memoryDepth}`);

// ── Actions ───────────────────────────────────────────────────

async function handleDownloadEmbed(): Promise<void> {
	error = null;
	downloadingEmbed = true;
	embedPct = 0;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			embedPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
	});
	try {
		await downloadModel(embedRepo, embedFile);
		embedPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloadingEmbed = false;
		unsub();
	}
}

async function handleDownloadRerank(): Promise<void> {
	error = null;
	downloadingRerank = true;
	rerankPct = 0;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			rerankPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
	});
	try {
		await downloadModel(rerankRepo, rerankFile);
		rerankPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloadingRerank = false;
		unsub();
	}
}

async function handleDownloadAll(): Promise<void> {
	if (embedStatus === "not_downloaded") await handleDownloadEmbed();
	if (rerankStatus === "not_downloaded") await handleDownloadRerank();
}
</script>

<div
	class="rounded-xl border p-5 transition-all"
	style="border-color: var(--border-subtle); background: var(--surface-base);"
	data-component="memory-card"
>
	<div class={stack({ gap: "3" })}>
		<!-- Header -->
		<div class={hstack({ justify: "between", align: "center" })}>
			<div class={stack({ gap: "1" })}>
				<div class={hstack({ gap: "2", align: "center" })}>
					<Brain size={18} style="color: var(--accent-teal-main);" />
					<Text size="base" weight="bold" color="primary">Memory</Text>
				</div>
				<Text size="xs" color="muted">How much Clyffy remembers about your project</Text>
			</div>
			<Badge
				variant={memoryReady ? "positive" : "neutral"}
				size="sm"
			>
				{memoryReady ? "Active" : bothInstalled ? "Ready" : "Setup needed"}
			</Badge>
		</div>

		<!-- Memory depth slider -->
		<div class={stack({ gap: "1" })}>
			<div class={hstack({ justify: "between", align: "center" })}>
				<Text size="sm" color="secondary">Memory depth</Text>
				<Text size="xs" color="muted">{depthLabel}</Text>
			</div>
			<input
				type="range"
				min="1"
				max="10"
				bind:value={memoryDepth}
				class="w-full accent-teal-500"
			/>
		</div>

		<!-- Install status -->
		{#if !bothInstalled}
			<div class="rounded-lg px-3 py-2" style="background: oklch(0.15 0 0 / 0.3);">
				<Text size="sm" color="secondary">
					Clyffy needs two small models to remember your code and docs.
				</Text>
				<div class="mt-2 flex gap-2">
					{#if embedStatus === "not_downloaded" && rerankStatus === "not_downloaded"}
						<button
							class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:brightness-125"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={handleDownloadAll}
						>
							<Download size={14} />
							Install both ({formatMb(embedSizeMb + rerankSizeMb)})
						</button>
					{:else}
						{#if embedStatus === "not_downloaded"}
							{#if downloadingEmbed}
								<div class={hstack({ gap: "1", align: "center" })}>
									<Loader2 size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
									<Text size="xs" color="muted">Search engine {embedPct}%</Text>
								</div>
							{:else}
								<button
									class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
									style="background: var(--accent-teal-main); color: var(--surface-base);"
									onclick={handleDownloadEmbed}
								>
									<Download size={10} />
									Search ({formatMb(embedSizeMb)})
								</button>
							{/if}
						{/if}
						{#if rerankStatus === "not_downloaded"}
							{#if downloadingRerank}
								<div class={hstack({ gap: "1", align: "center" })}>
									<Loader2 size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
									<Text size="xs" color="muted">Ranking {rerankPct}%</Text>
								</div>
							{:else}
								<button
									class="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold transition-all hover:brightness-125"
									style="background: var(--accent-teal-main); color: var(--surface-base);"
									onclick={handleDownloadRerank}
								>
									<Download size={10} />
									Ranking ({formatMb(rerankSizeMb)})
								</button>
							{/if}
						{/if}
					{/if}
				</div>
			</div>
		{/if}

		<!-- Advanced view -->
		{#if advanced}
			<div class="rounded border px-3 py-2" style="border-color: var(--border-subtle); background: oklch(0.15 0 0 / 0.5);">
				<Text size="xs" color="muted">
					Embedder: {EMBEDDER_SLOT} ({embedStatus}) |
					Reranker: {RERANKER_SLOT} ({rerankStatus}) |
					top-k: {memoryDepth}
				</Text>
			</div>
		{/if}

		<!-- Error -->
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>
