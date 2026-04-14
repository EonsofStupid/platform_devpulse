<!--
  @file ModelSearch — Full-screen overlay for HuggingFace model search.
  Opens as a modal overlay when user clicks "Search HuggingFace".
  GGUF / SafeTensors tab separation. Download progress tracking.
  Post-download confirmation: "Load this model now?"
  ALL styling via ColdLight components + renderForge + cssVarString.
-->
<script lang="ts">
import { listen } from "@tauri-apps/api/event";
import { ArrowRight, Check, Download, LoaderCircle, Search, X } from "lucide-svelte";
import { Card } from "$lib/design/components/card/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
import { searchState } from "../../data-access/search.state.svelte.js";
import ClyffyNarration from "../../ui/ClyffyNarration.svelte";
import HfModelCard from "./HfModelCard.svelte";

interface Props {
	onDownload?: (
		repoId: string,
		filename: string,
	) => Promise<string | undefined> | string | undefined;
	onClose?: () => void;
}

let { onDownload, onClose }: Props = $props();

const m = $derived(renderForge({ kind: "model-search", preset: "neutral" }));
const cardM = $derived(renderForge({ kind: "card", preset: "glass" }));

// ── Format tab ───────────────────────────────────────────────
type FormatTab = "gguf" | "safetensors";
let activeFormat = $state<FormatTab>("gguf");

// ── Download tracking ────────────────────────────────────────
interface ActiveDownload {
	downloadId: string;
	repoId: string;
	filename: string;
	bytesDownloaded: number;
	totalBytes: number;
	speedBps: number;
	complete: boolean;
}

let activeDownloads = $state<ActiveDownload[]>([]);

/** Download that just finished — show "Load now?" confirmation. */
let completedDownload = $state<ActiveDownload | null>(null);

/** Which slot to load the downloaded model into. */
let loadTargetSlot = $state<string | null>(null);

// ── Download event listeners ─────────────────────────────────
let unlistenProgress: (() => void) | null = null;
let unlistenComplete: (() => void) | null = null;

$effect(() => {
	listen<{ download_id: string; bytes_downloaded: number; total_bytes: number; speed_bps: number }>(
		"model:download-progress",
		(event) => {
			const p = event.payload;
			const idx = activeDownloads.findIndex((d) => d.downloadId === p.download_id);
			if (idx >= 0) {
				activeDownloads[idx].bytesDownloaded = p.bytes_downloaded;
				activeDownloads[idx].totalBytes = p.total_bytes;
				activeDownloads[idx].speedBps = p.speed_bps;
			}
		},
	).then((fn) => {
		unlistenProgress = fn;
	});

	listen<{ download_id: string }>("model:download-complete", (event) => {
		const idx = activeDownloads.findIndex((d) => d.downloadId === event.payload.download_id);
		if (idx >= 0) {
			activeDownloads[idx].complete = true;
			completedDownload = activeDownloads[idx];
			activeDownloads = activeDownloads.filter((_, i) => i !== idx);
		}
		void modelsState.scan();
		void modelsState.refresh();
	}).then((fn) => {
		unlistenComplete = fn;
	});

	return () => {
		unlistenProgress?.();
		unlistenComplete?.();
	};
});

// ── Actions ──────────────────────────────────────────────────
function handleInput(e: Event) {
	const target = e.target as HTMLInputElement;
	searchState.setQuery(target.value);
}

function handleClear() {
	searchState.clear();
}

async function handleDownload(repoId: string, filename: string): Promise<void> {
	const downloadId = await onDownload?.(repoId, filename);
	if (typeof downloadId !== "string" || downloadId.length === 0) return;

	// Track this download locally with the real backend UUID.
	const dl: ActiveDownload = {
		downloadId,
		repoId,
		filename,
		bytesDownloaded: 0,
		totalBytes: 0,
		speedBps: 0,
		complete: false,
	};
	activeDownloads = [...activeDownloads, dl];
}

async function handleLoadNow() {
	if (!completedDownload) return;
	// Find the first compatible slot and load
	const slotId = loadTargetSlot ?? "chat.brain";
	completedDownload = null;
	loadTargetSlot = null;
	try {
		await modelsState.load(slotId);
	} catch {
		// SwapOverlay handles errors
	}
}

function handleSkipLoad() {
	completedDownload = null;
	loadTargetSlot = null;
}

function formatSpeed(bps: number): string {
	if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} MB/s`;
	if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} KB/s`;
	return `${bps} B/s`;
}

function formatBytes(bytes: number): string {
	if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
	if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
	if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
	return `${bytes} B`;
}
</script>

<!-- Full-screen overlay -->
<div
	class="fixed inset-0 z-40 flex flex-col"
	style="background: var(--glass-void, rgba(0,0,0,0.85)); backdrop-filter: blur(12px);"
	role="dialog"
	aria-modal="true"
	aria-label="Search HuggingFace Models"
>
	<!-- ── Header ──────────────────────────────────────────────── -->
	<header class="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
		<Text size="lg" weight="bold" color="primary">Search HuggingFace</Text>
		<button
			class="rounded p-2 opacity-60 hover:opacity-100 transition-opacity"
			onclick={() => onClose?.()}
			aria-label="Close search"
		>
			<X size={20} />
		</button>
	</header>

	<!-- ── Format tabs ─────────────────────────────────────────── -->
	<nav class="flex border-b border-[var(--border-subtle)] px-6">
		<button
			class="px-4 py-2.5 text-sm font-medium transition-colors
				{activeFormat === 'gguf'
					? 'text-[var(--color-teal-400)] border-b-2 border-[var(--color-teal-400)]'
					: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
			onclick={() => (activeFormat = "gguf")}
		>
			GGUF Models
		</button>
		<button
			class="px-4 py-2.5 text-sm font-medium transition-colors
				{activeFormat === 'safetensors'
					? 'text-[var(--color-teal-400)] border-b-2 border-[var(--color-teal-400)]'
					: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
			onclick={() => (activeFormat = "safetensors")}
		>
			SafeTensors
		</button>
	</nav>

	<!-- ── Search input ────────────────────────────────────────── -->
	<div class="px-6 py-3">
		<div class="relative">
			<Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" />
			<input
				type="text"
				value={searchState.query}
				oninput={handleInput}
				placeholder={activeFormat === "gguf"
					? "Search GGUF models (e.g. Qwen, Llama, Mistral...)"
					: "Search SafeTensors models (e.g. embedding, reranker...)"}
				class="w-full rounded-lg border border-[var(--border-subtle)] py-3 pl-11 pr-10 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-teal-400)]"
				style="background: var(--surface-raised); color: var(--text-primary);"
			/>
			{#if searchState.query}
				<button
					class="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
					onclick={handleClear}
				>
					<X size={16} />
				</button>
			{/if}
		</div>
	</div>

	<!-- ── Active downloads banner ─────────────────────────────── -->
	{#if activeDownloads.length > 0}
		<div class="px-6 pb-2">
			{#each activeDownloads as dl (dl.downloadId)}
				<div class="flex items-center gap-3 rounded-lg px-4 py-2 mb-1" style="background: var(--surface-raised);">
					<LoaderCircle size={16} class="animate-spin shrink-0" style="color: var(--color-teal-400);" />
					<div class="flex-1 min-w-0">
						<Text size="xs" weight="medium" color="primary" class="truncate">{dl.filename}</Text>
						<div class="mt-1">
							<Progress value={dl.totalBytes > 0 ? (dl.bytesDownloaded / dl.totalBytes) * 100 : 0} max={100} size="sm" />
						</div>
					</div>
					<Text size="xs" color="muted">
						{dl.totalBytes > 0 ? `${formatBytes(dl.bytesDownloaded)} / ${formatBytes(dl.totalBytes)}` : "Starting..."}
						{#if dl.speedBps > 0}
							<span class="ml-1 opacity-60">{formatSpeed(dl.speedBps)}</span>
						{/if}
					</Text>
				</div>
			{/each}
		</div>
	{/if}

	<!-- ── Results ─────────────────────────────────────────────── -->
	<main class="flex-1 overflow-y-auto px-6 pb-6">
		{#if searchState.searching}
			<div class="flex items-center justify-center gap-3 py-16">
				<LoaderCircle size={24} class="animate-spin opacity-50" />
				<Text size="base" color="muted">Searching HuggingFace...</Text>
			</div>
		{:else if searchState.error}
			<ClyffyNarration message={searchState.error} type="error" />
		{:else if searchState.results.length > 0}
			<div class={stack({ gap: "3" })}>
				{#each searchState.results as result (result.repo_id)}
					<HfModelCard
						{result}
						onDownload={(repoId, filename) => handleDownload(repoId, filename)}
						downloading={activeDownloads.some((d) => d.repoId === result.repo_id)}
					/>
				{/each}
				{#if searchState.hasMore}
					<button
						class="flex items-center justify-center gap-2 rounded-lg py-3 text-sm transition-colors hover:brightness-110"
						style="background: var(--surface-raised); color: var(--text-secondary);"
						onclick={() => searchState.loadMore()}
						disabled={searchState.loadingMore}
					>
						{#if searchState.loadingMore}
							<LoaderCircle size={14} class="animate-spin" />
							Loading more...
						{:else}
							Load more results
						{/if}
					</button>
				{/if}
			</div>
		{:else if searchState.query.trim()}
			<div class="flex flex-col items-center gap-3 py-16 opacity-50">
				<Search size={32} />
				<Text size="base" color="muted">No {activeFormat.toUpperCase()} models found for "{searchState.query}"</Text>
			</div>
		{:else}
			<div class="flex flex-col items-center gap-3 py-16 opacity-40">
				<Search size={32} />
				<Text size="base" color="muted">Search HuggingFace for AI models to download</Text>
				<Text size="sm" color="muted">
					{activeFormat === "gguf"
						? "GGUF models work with llama.cpp — optimized for local inference"
						: "SafeTensors models work with Candle — native Rust inference"}
				</Text>
			</div>
		{/if}
	</main>

	<!-- ── Post-download confirmation overlay ──────────────────── -->
	{#if completedDownload}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center"
			style="background: rgba(0,0,0,0.7); backdrop-filter: blur(6px);"
		>
			<div
				{...cardM.dataAttrs}
				style={cssVarString(cardM.cssVars)}
				class="flex flex-col items-center gap-5 max-w-md w-full mx-4 p-8 rounded-xl text-center"
			>
				<div style="color: var(--signal-success);">
					<Check size={40} />
				</div>
				<Text size="lg" weight="bold" color="primary">Download Complete</Text>
				<Text size="sm" color="muted">{completedDownload.filename}</Text>

				<!-- Slot picker for loading -->
				<div class="w-full text-left">
					<Text size="xs" weight="semibold" color="secondary" class="mb-2">Load into:</Text>
					<div class={stack({ gap: "1" })}>
						{#each modelsState.userSlots as slot (slot.id)}
							<button
								class="flex items-center justify-between rounded-lg px-4 py-2.5 text-left transition-colors text-sm"
								style="background: {loadTargetSlot === slot.id ? 'var(--accent-teal-main)' : 'var(--surface-raised)'}; color: {loadTargetSlot === slot.id ? 'var(--surface-base)' : 'var(--text-primary)'}; border: 1px solid {loadTargetSlot === slot.id ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
								onclick={() => (loadTargetSlot = slot.id)}
							>
								<span>{slot.label ?? slot.id}</span>
								{#if loadTargetSlot === slot.id}
									<Check size={14} />
								{/if}
							</button>
						{/each}
					</div>
				</div>

				<div class="flex gap-3 w-full">
					<button
						class="flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all hover:brightness-125"
						style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: 0 0 0.75rem var(--accent-teal-glow);"
						onclick={handleLoadNow}
						disabled={!loadTargetSlot}
					>
						<ArrowRight size={16} />
						Load Now
					</button>
					<button
						class="rounded-lg px-4 py-2.5 text-sm transition-colors"
						style="color: var(--text-muted); border: 1px solid var(--border-subtle);"
						onclick={handleSkipLoad}
					>
						Later
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
