<!--
  @file MemoryCard — "How much Clyffy remembers" card for the consumer model loader.
  Knowledge retrieval pipeline shown as unified "memory" system. Depth slider. Zero jargon.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Brain, Download, Loader2, Power, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import { narrationState } from "../runes/narration.runes.svelte.js";
import { getCatalogForSlot } from "../services/catalog.service.js";
import { cancelDownload, downloadModel, onDownloadProgress } from "../services/download.service.js";
import {
	formatEta,
	formatMb,
	formatSpeed,
	slotDisplayStatus,
	statusColor,
	statusLabel,
} from "../types/models.types.js";
import ModelPicker from "./ModelPicker.svelte";

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
let embedDownloadId = $state<string | null>(null);
let rerankDownloadId = $state<string | null>(null);
let embedPct = $state(0);
let rerankPct = $state(0);
let embedSpeedBps = $state(0);
let rerankSpeedBps = $state(0);
let embedEtaSecs = $state(-1);
let rerankEtaSecs = $state(-1);
let memoryDepth = $state(5); // Maps to retrieval top-k
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

const embedStatus = $derived(
	slotDisplayStatus(
		modelsState.statuses[EMBEDDER_SLOT],
		!!modelsState.slots.find((s) => s.id === EMBEDDER_SLOT)?.assigned_model_id,
	),
);
const rerankStatus = $derived(
	slotDisplayStatus(
		modelsState.statuses[RERANKER_SLOT],
		!!modelsState.slots.find((s) => s.id === RERANKER_SLOT)?.assigned_model_id,
	),
);
const memoryReady = $derived(
	(embedStatus === "active" || embedStatus === "downloaded") &&
		(rerankStatus === "active" || rerankStatus === "downloaded"),
);
const bothInstalled = $derived(
	embedStatus !== "not_downloaded" && rerankStatus !== "not_downloaded",
);
const embedCapability = $derived(
	modelsState.slots.find((s) => s.id === EMBEDDER_SLOT)?.capability ?? "embedding",
);
const rerankCapability = $derived(
	modelsState.slots.find((s) => s.id === RERANKER_SLOT)?.capability ?? "reranking",
);
const embedModelStatus = $derived(modelsState.statuses[EMBEDDER_SLOT]);
const rerankModelStatus = $derived(modelsState.statuses[RERANKER_SLOT]);
const embedTransitioning = $derived(
	embedModelStatus?.type === "loading" || embedModelStatus?.type === "unloading",
);
const rerankTransitioning = $derived(
	rerankModelStatus?.type === "loading" || rerankModelStatus?.type === "unloading",
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
	embedSpeedBps = 0;
	embedEtaSecs = -1;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			embedPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		embedSpeedBps = p.speedBps;
		embedEtaSecs = p.etaSecs;
		if (!embedDownloadId && p.downloadId) embedDownloadId = p.downloadId;
	});
	try {
		const id = await downloadModel(embedRepo, embedFile);
		embedDownloadId = id;
		embedPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
		const embedModel = modelsState.models.find((m) => m.filename === embedFile);
		if (embedModel) {
			await modelsState.assign(EMBEDDER_SLOT, embedModel.id);
		}
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloadingEmbed = false;
		embedDownloadId = null;
		unsub();
	}
}

async function handleCancelEmbed(): Promise<void> {
	if (!embedDownloadId) return;
	try {
		await cancelDownload(embedDownloadId);
		downloadingEmbed = false;
		embedDownloadId = null;
		embedPct = 0;
	} catch (e) {
		error = `Cancel failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleDownloadRerank(): Promise<void> {
	error = null;
	downloadingRerank = true;
	rerankPct = 0;
	rerankSpeedBps = 0;
	rerankEtaSecs = -1;
	const unsub = onDownloadProgress((p) => {
		if (p.totalBytes > 0)
			rerankPct = Math.min(99, Math.round((p.bytesDownloaded / p.totalBytes) * 100));
		rerankSpeedBps = p.speedBps;
		rerankEtaSecs = p.etaSecs;
		if (!rerankDownloadId && p.downloadId) rerankDownloadId = p.downloadId;
	});
	try {
		const id = await downloadModel(rerankRepo, rerankFile);
		rerankDownloadId = id;
		rerankPct = 100;
		await modelsState.scan();
		await modelsState.refresh();
		const rerankModel = modelsState.models.find((m) => m.filename === rerankFile);
		if (rerankModel) {
			await modelsState.assign(RERANKER_SLOT, rerankModel.id);
		}
	} catch (e) {
		error = `Download failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		downloadingRerank = false;
		rerankDownloadId = null;
		unsub();
	}
}

async function handleCancelRerank(): Promise<void> {
	if (!rerankDownloadId) return;
	try {
		await cancelDownload(rerankDownloadId);
		downloadingRerank = false;
		rerankDownloadId = null;
		rerankPct = 0;
	} catch (e) {
		error = `Cancel failed: ${e instanceof Error ? e.message : String(e)}`;
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
	title="Memory lets Clyffy remember your code, docs, and project context — the more memory, the better Clyffy understands your project"
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
				title={memoryReady
					? "Memory is active — Clyffy can search and remember your project files"
					: bothInstalled
						? "Memory models are downloaded — ready to activate"
						: "Two small models need to be installed for Clyffy to remember your project"}
			>
				{memoryReady ? "Active" : bothInstalled ? "Ready" : "Setup needed"}
			</Badge>
		</div>

		<!-- Memory depth slider -->
		<div class={stack({ gap: "1" })} title="Controls how many pieces of your project Clyffy searches through when answering questions — higher means more thorough but slower">
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

		<!-- Model pickers for embedder + reranker -->
		<div class={stack({ gap: "2" })}>
			<div>
				<Text size="xs" color="muted">Search engine model:</Text>
				<ModelPicker
					slotId={EMBEDDER_SLOT}
					capability={embedCapability}
					onAssign={() => { error = null; }}
				/>
				{#if embedTransitioning && embedModelStatus}
					<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
						<Loader2 size={12} class="animate-spin" style="color: {statusColor(embedModelStatus)};" />
						<Text size="xs" color="muted">{statusLabel(embedModelStatus)}</Text>
					</div>
				{/if}
			</div>
			<div>
				<Text size="xs" color="muted">Relevance scorer model:</Text>
				<ModelPicker
					slotId={RERANKER_SLOT}
					capability={rerankCapability}
					onAssign={() => { error = null; }}
				/>
				{#if rerankTransitioning && rerankModelStatus}
					<div class={`${hstack({ gap: "2", align: "center" })} mt-1`}>
						<Loader2 size={12} class="animate-spin" style="color: {statusColor(rerankModelStatus)};" />
						<Text size="xs" color="muted">{statusLabel(rerankModelStatus)}</Text>
					</div>
				{/if}
			</div>
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
							title="Download both memory models — a search engine and a relevance scorer. They work together to help Clyffy find the right code and docs."
						>
							<Download size={14} />
							Install both ({formatMb(embedSizeMb + rerankSizeMb)})
						</button>
					{:else}
						{#if embedStatus === "not_downloaded"}
							{#if downloadingEmbed}
								<div class={hstack({ gap: "1", align: "center" })}>
									<Loader2 size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
									<Text size="xs" color="muted">Search {embedPct}%</Text>
									{#if embedSpeedBps > 0}
										<Text size="xs" color="muted">{formatSpeed(embedSpeedBps)}</Text>
									{/if}
									{#if embedEtaSecs >= 0}
										<Text size="xs" color="muted">{formatEta(embedEtaSecs)}</Text>
									{/if}
									<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={handleCancelEmbed} title="Cancel" aria-label="Cancel embedder download">
										<X size={10} />
									</button>
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
									{#if rerankSpeedBps > 0}
										<Text size="xs" color="muted">{formatSpeed(rerankSpeedBps)}</Text>
									{/if}
									{#if rerankEtaSecs >= 0}
										<Text size="xs" color="muted">{formatEta(rerankEtaSecs)}</Text>
									{/if}
									<button class="rounded p-0.5" style="color: var(--signal-error);" onclick={handleCancelRerank} title="Cancel" aria-label="Cancel reranker download">
										<X size={10} />
									</button>
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

		<!-- Clyffy narration -->
		{#each [narrationState.forSlot(EMBEDDER_SLOT), narrationState.forSlot(RERANKER_SLOT)] as msg}
			{#if msg}
				<div
					class="rounded-lg border-l-2 px-3 py-2 text-xs"
					style="background: oklch(0.15 0.02 185 / 0.3); border-color: var(--accent-teal-main); color: var(--text-secondary);"
				>
					{msg.text}
				</div>
			{/if}
		{/each}

		<!-- Error -->
		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{/if}
	</div>
</div>
