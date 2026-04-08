<!--
  @file HuggingFaceSearch.svelte
  Inline HuggingFace search. NOT a popup. Renders below slot cards.
  Search, filter by format (GGUF/SafeTensors), download per-file with slot selection.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Download, FileText, Layers, Search } from "lucide-svelte";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { searchState } from "../../../runes/search.runes.svelte.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatMb,
	friendlySlotLabel,
} from "../../../types/models.types.js";

interface Props {
	onDownload: (repoId: string, filename: string, targetSlot: string) => Promise<void>;
}

let { onDownload }: Props = $props();

let searchInput = $state("");
let downloadingFile = $state<string | null>(null);
let selectedSlotForDownload = $state<Record<string, string>>({});
let formatTab = $state<"gguf" | "safetensors" | "all">("all");
let tooltipVisible = $state<string | null>(null);
let tooltipTimer = $state<ReturnType<typeof setTimeout> | null>(null);

function showTooltip(id: string) {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipTimer = setTimeout(() => {
		tooltipVisible = id;
	}, 300);
}
function hideTooltip() {
	if (tooltipTimer) clearTimeout(tooltipTimer);
	tooltipVisible = null;
}

function handleSearch(): void {
	searchState.setQuery(searchInput);
}

function handleInputKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter") handleSearch();
}

function selectSlotForFile(fileKey: string, slotId: string): void {
	selectedSlotForDownload = { ...selectedSlotForDownload, [fileKey]: slotId };
}

async function handleDownloadFile(
	repoId: string,
	filename: string,
	fileKey: string,
): Promise<void> {
	const targetSlot =
		selectedSlotForDownload[fileKey] ?? modelsState.userSlots[0]?.id ?? "chat.brain";
	downloadingFile = fileKey;
	try {
		await onDownload(repoId, filename, targetSlot);
	} finally {
		downloadingFile = null;
	}
}

function formatDownloads(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return `${n}`;
}

function isGgufFile(filename: string): boolean {
	return filename.toLowerCase().endsWith(".gguf");
}

function isSafetensorFile(filename: string): boolean {
	return filename.toLowerCase().endsWith(".safetensors");
}
</script>

<div class="hf-section">
	<h3 class="hf-title"><Search size={16} /> Search HuggingFace</h3>

	<!-- Search input -->
	<div class="search-row">
		<input
			type="text"
			bind:value={searchInput}
			placeholder="Search for models (e.g. Qwen3, Llama, Mistral)..."
			class="search-input"
			onkeydown={handleInputKeydown}
			aria-label="Search HuggingFace for models"
		/>
		<button class="btn-accent" onclick={handleSearch} aria-label="Search">
			<Search size={16} /> Search
		</button>
	</div>

	<!-- Format filter tabs -->
	<div class="format-tabs">
		<button class="format-tab" class:active={formatTab === "all"} onclick={() => (formatTab = "all")}
			onmouseenter={() => showTooltip("tab-all")} onmouseleave={hideTooltip}>
			All Formats
		</button>
		<button class="format-tab" class:active={formatTab === "gguf"} onclick={() => (formatTab = "gguf")}
			onmouseenter={() => showTooltip("tab-gguf")} onmouseleave={hideTooltip}>
			<FileText size={14} /> GGUF
		</button>
		<button class="format-tab" class:active={formatTab === "safetensors"} onclick={() => (formatTab = "safetensors")}
			onmouseenter={() => showTooltip("tab-st")} onmouseleave={hideTooltip}>
			<Layers size={14} /> SafeTensors
		</button>
		{#if tooltipVisible === "tab-all"}
			<div class="tooltip">Show all model files regardless of format</div>
		{/if}
		{#if tooltipVisible === "tab-gguf"}
			<div class="tooltip">GGUF files — single file, ready to use. Best for local inference with llama.cpp or Candle.</div>
		{/if}
		{#if tooltipVisible === "tab-st"}
			<div class="tooltip">SafeTensors files — may have multiple shards. Used for larger models split across files. All shards download together.</div>
		{/if}
	</div>

	<!-- Loading -->
	{#if searchState.searching}
		<div class="center-msg">
			<Spinner size="sm" />
			<span>Searching HuggingFace...</span>
		</div>
	{/if}

	<!-- Error -->
	{#if searchState.error}
		<div class="error-box">
			<span>{searchState.error}</span>
		</div>
	{/if}

	<!-- Results -->
	{#if !searchState.searching && searchState.results.length > 0}
		<span class="result-count">{searchState.results.length} result{searchState.results.length === 1 ? "" : "s"}</span>

		{#each searchState.results as result (result.repo_id)}
			{@const ggufFiles = result.gguf_files?.filter((f) =>
				formatTab === "gguf" ? isGgufFile(f.filename) :
				formatTab === "safetensors" ? isSafetensorFile(f.filename) :
				true
			) ?? []}
			{@const safetensorShards = ggufFiles.filter((f) => isSafetensorFile(f.filename))}
			{@const ggufOnly = ggufFiles.filter((f) => isGgufFile(f.filename))}
			{@const hasGguf = ggufOnly.length > 0}
			{@const hasSafetensors = safetensorShards.length > 0}

			{#if ggufFiles.length > 0 || formatTab === "all"}
				<div class="result-card">
					<!-- Result header -->
					<div class="result-header">
						<div class="result-meta">
							<span class="result-name">{result.model_name}</span>
							<span class="result-author">{result.author}</span>
						</div>
						<div class="result-stats">
							<span class="stat">&#8595; {formatDownloads(result.downloads)}</span>
							<span class="stat">&#9829; {result.likes}</span>
						</div>
					</div>

					{#if result.pipeline_tag}
						<span class="pipeline-badge">{result.pipeline_tag}</span>
					{/if}

					<!-- GGUF section -->
					{#if hasGguf && (formatTab === "all" || formatTab === "gguf")}
						<div class="format-section">
							<span class="format-label"><FileText size={14} /> GGUF Files ({ggufOnly.length})</span>
							<span class="format-hint">Single file, ready to use. Pick a quantization level:</span>
						</div>
						{#each ggufOnly as file (file.filename)}
							{@const fileSizeMb = Math.round(file.size_bytes / (1024 * 1024))}
							{@const fit = calculateFit(fileSizeMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
							{@const fileKey = `${result.repo_id}/${file.filename}`}
							{@const isDownloading = downloadingFile === fileKey}
							{@const selectedSlot = selectedSlotForDownload[fileKey] ?? modelsState.userSlots[0]?.id ?? "chat.brain"}

							<div class="file-row">
								<div class="file-info">
									<span class="file-name">{file.filename}</span>
									<div class="file-tags">
										{#if file.quant_level}<span class="tag">{file.quant_level}</span>{/if}
										<span class="tag-muted">{formatMb(fileSizeMb)}</span>
										<span class="fit-badge" style="color:{fitColor(fit)}">{fitLabel(fit)}</span>
									</div>
								</div>

								<!-- Slot selector -->
								<div class="slot-chips">
									<span class="slot-label">Install to:</span>
									{#each modelsState.userSlots as slot (slot.id)}
										{@const isSelected = selectedSlot === slot.id}
										<button
											class="slot-chip" class:selected={isSelected}
											onclick={() => selectSlotForFile(fileKey, slot.id)}
											aria-label="Install to {friendlySlotLabel(slot.id)}"
											aria-pressed={isSelected}
										>
											{friendlySlotLabel(slot.id)}
										</button>
									{/each}
								</div>

								<button
									class="btn-accent" disabled={isDownloading}
									onclick={() => handleDownloadFile(result.repo_id, file.filename, fileKey)}
									aria-label="Download {file.filename} to {friendlySlotLabel(selectedSlot)}"
								>
									{#if isDownloading}<Spinner size="sm" /> Downloading...
									{:else}<Download size={14} /> Download to {friendlySlotLabel(selectedSlot)}{/if}
								</button>

								<!-- Disk space warning -->
								{#if hardwareState.diskFreeMb && fileSizeMb > hardwareState.diskFreeMb * 0.9}
									<div class="disk-warn">
										Not enough disk space. Need {formatMb(fileSizeMb)}, only {formatMb(hardwareState.diskFreeMb)} free.
									</div>
								{/if}
							</div>
						{/each}
					{/if}

					<!-- SafeTensors section -->
					{#if hasSafetensors && (formatTab === "all" || formatTab === "safetensors")}
						<div class="format-section">
							<span class="format-label"><Layers size={14} /> SafeTensors ({safetensorShards.length} shard{safetensorShards.length === 1 ? "" : "s"})</span>
							<span class="format-hint">Multi-shard model. All shards download together as one model.</span>
						</div>
						{@const totalSizeMb = safetensorShards.reduce((sum, f) => sum + Math.round(f.size_bytes / (1024 * 1024)), 0)}
						{@const fit = calculateFit(totalSizeMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
						{@const groupKey = `${result.repo_id}/safetensors`}
						{@const isDownloading = downloadingFile === groupKey}
						{@const selectedSlot = selectedSlotForDownload[groupKey] ?? modelsState.userSlots[0]?.id ?? "chat.brain"}

						<div class="shard-group">
							<div class="shard-summary">
								<span class="shard-total">{safetensorShards.length} shards &middot; {formatMb(totalSizeMb)} total</span>
								<span class="fit-badge" style="color:{fitColor(fit)}">{fitLabel(fit)}</span>
							</div>
							<div class="shard-list">
								{#each safetensorShards as shard, i (shard.filename)}
									<span class="shard-item">
										{i + 1}. {shard.filename} ({formatMb(Math.round(shard.size_bytes / (1024 * 1024)))})
									</span>
								{/each}
							</div>

							<div class="slot-chips">
								<span class="slot-label">Install to:</span>
								{#each modelsState.userSlots as slot (slot.id)}
									{@const isSelected = selectedSlot === slot.id}
									<button
										class="slot-chip" class:selected={isSelected}
										onclick={() => selectSlotForFile(groupKey, slot.id)}
										aria-label="Install to {friendlySlotLabel(slot.id)}"
										aria-pressed={isSelected}
									>
										{friendlySlotLabel(slot.id)}
									</button>
								{/each}
							</div>

							<button
								class="btn-accent" disabled={isDownloading}
								onclick={() => handleDownloadFile(result.repo_id, safetensorShards[0].filename, groupKey)}
								aria-label="Download all shards to {friendlySlotLabel(selectedSlot)}"
							>
								{#if isDownloading}<Spinner size="sm" /> Downloading all shards...
								{:else}<Download size={14} /> Download All Shards to {friendlySlotLabel(selectedSlot)}{/if}
							</button>

							{#if hardwareState.diskFreeMb && totalSizeMb > hardwareState.diskFreeMb * 0.9}
								<div class="disk-warn">
									Not enough disk space. Need {formatMb(totalSizeMb)}, only {formatMb(hardwareState.diskFreeMb)} free.
								</div>
							{/if}
						</div>
					{/if}

					<!-- No matching files for this format tab -->
					{#if ggufFiles.length === 0 && formatTab !== "all"}
						<span class="no-files">No {formatTab === "gguf" ? "GGUF" : "SafeTensors"} files in this repo</span>
					{/if}
				</div>
			{/if}
		{/each}

		<!-- Load More -->
		{#if searchState.hasMore}
			<div class="center-actions">
				<button class="btn-outline-lg" onclick={() => searchState.loadMore()} disabled={searchState.loadingMore} aria-label="Load more search results">
					{#if searchState.loadingMore}<Spinner size="sm" /> Loading more...
					{:else}Load More Results{/if}
				</button>
			</div>
		{/if}
	{/if}

	<!-- Empty state -->
	{#if !searchState.searching && searchState.query && searchState.results.length === 0 && !searchState.error}
		<div class="center-msg">
			<span>No results found</span>
			<span class="muted">Try a different search term</span>
		</div>
	{/if}

	<!-- No search yet -->
	{#if !searchState.query && !searchState.searching}
		<div class="center-msg muted">
			Search HuggingFace to find and download models
		</div>
	{/if}
</div>

<style>
	.hf-section { display:flex;flex-direction:column;gap:0.75rem; }
	.hf-title { display:flex;align-items:center;gap:0.5rem;font-size:1rem;font-weight:800;color:oklch(0.93 0.015 224);margin:0; }

	/* Search */
	.search-row { display:flex;gap:0.5rem; }
	.search-input { flex:1;padding:0.625rem 0.875rem;border-radius:0.5rem;border:1px solid oklch(0.3 0.03 220/0.4);background:oklch(0.12 0.02 220/0.6);color:oklch(0.93 0.015 224);font-size:0.875rem;outline:none; }
	.search-input::placeholder { color:oklch(0.45 0.02 220); }
	.search-input:focus { border-color:oklch(0.65 0.17 185); }

	/* Format tabs */
	.format-tabs { display:flex;gap:0.25rem;padding:0.25rem;background:oklch(0.1 0.015 220/0.5);border-radius:0.5rem;position:relative; }
	.format-tab { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 0.875rem;border-radius:0.375rem;border:none;background:transparent;color:oklch(0.6 0.02 220);font-size:0.8125rem;font-weight:600;cursor:pointer;transition:all 100ms; }
	.format-tab.active { background:oklch(0.2 0.03 185/0.3);color:oklch(0.65 0.17 185); }
	.format-tab:hover:not(.active) { background:oklch(0.15 0.015 220/0.4); }

	/* Results */
	.result-count { font-size:0.8125rem;color:oklch(0.55 0.02 220); }
	.result-card { background:oklch(0.12 0.025 220/0.65);border:1px solid oklch(0.3 0.03 220/0.4);border-radius:0.75rem;padding:1rem;display:flex;flex-direction:column;gap:0.75rem;backdrop-filter:blur(12px); }
	.result-header { display:flex;align-items:flex-start;gap:0.75rem; }
	.result-meta { flex:1;min-width:0; }
	.result-name { display:block;font-size:0.9375rem;font-weight:700;color:oklch(0.93 0.015 224); }
	.result-author { display:block;font-size:0.8125rem;color:oklch(0.55 0.02 220); }
	.result-stats { display:flex;gap:0.75rem;flex-shrink:0; }
	.stat { font-size:0.8125rem;color:oklch(0.55 0.02 220); }
	.pipeline-badge { display:inline-block;padding:0.125rem 0.5rem;border-radius:0.25rem;background:oklch(0.2 0.02 220/0.6);color:oklch(0.7 0.02 220);font-size:0.875rem;align-self:flex-start; }

	/* Format section headers */
	.format-section { display:flex;flex-direction:column;gap:0.125rem;padding-top:0.5rem;border-top:1px solid oklch(0.25 0.02 220/0.4); }
	.format-label { display:flex;align-items:center;gap:0.375rem;font-size:0.8125rem;font-weight:700;color:oklch(0.8 0.02 220); }
	.format-hint { font-size:0.875rem;color:oklch(0.5 0.02 220); }

	/* File rows */
	.file-row { background:oklch(0.15 0.02 220/0.5);border-radius:0.5rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem; }
	.file-row:hover { background:oklch(0.17 0.02 220/0.5); }
	.file-info { display:flex;flex-direction:column;gap:0.25rem; }
	.file-name { font-size:0.875rem;font-weight:600;color:oklch(0.9 0.015 224);overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
	.file-tags { display:flex;flex-wrap:wrap;gap:0.375rem;align-items:center; }

	/* SafeTensor shards */
	.shard-group { background:oklch(0.15 0.02 220/0.5);border-radius:0.5rem;padding:0.75rem;display:flex;flex-direction:column;gap:0.5rem; }
	.shard-summary { display:flex;align-items:center;gap:0.75rem; }
	.shard-total { font-size:0.875rem;font-weight:600;color:oklch(0.85 0.015 224); }
	.shard-list { display:flex;flex-direction:column;gap:0.125rem;padding:0.5rem;background:oklch(0.1 0.015 220/0.4);border-radius:0.375rem;max-height:8rem;overflow-y:auto; }
	.shard-item { font-size:0.875rem;color:oklch(0.6 0.02 220);font-family:monospace; }

	/* Slot chips */
	.slot-chips { display:flex;align-items:center;gap:0.375rem;flex-wrap:wrap; }
	.slot-label { font-size:0.875rem;color:oklch(0.5 0.02 220); }
	.slot-chip { padding:0.25rem 0.625rem;border-radius:9999px;border:1px solid oklch(0.3 0.03 220/0.4);background:transparent;color:oklch(0.65 0.02 220);font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 100ms; }
	.slot-chip.selected { background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);border-color:oklch(0.65 0.17 185); }
	.slot-chip:hover:not(.selected) { background:oklch(0.18 0.015 220/0.3); }

	/* Tags */
	.tag { font-size:0.875rem;padding:0.125rem 0.5rem;border-radius:0.25rem;background:oklch(0.2 0.02 220/0.6);color:oklch(0.8 0.02 220); }
	.tag-muted { font-size:0.8125rem;color:oklch(0.6 0.02 220); }
	.fit-badge { font-size:0.875rem;font-weight:600; }

	/* Disk warning */
	.disk-warn { padding:0.5rem 0.75rem;border-radius:0.375rem;background:oklch(0.2 0.08 25/0.25);border:1px solid oklch(0.6 0.22 25/0.4);color:oklch(0.8 0.12 25);font-size:0.8125rem; }

	/* Buttons */
	.btn-accent { display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:0.5rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.8125rem;font-weight:700;cursor:pointer;align-self:flex-end; }
	.btn-accent:hover { filter:brightness(1.15); }
	.btn-accent:disabled { opacity:0.4;cursor:not-allowed; }
	.btn-outline-lg { display:inline-flex;align-items:center;gap:0.5rem;padding:0.625rem 1.5rem;border-radius:0.625rem;border:1px solid oklch(0.65 0.17 185/0.4);background:transparent;color:oklch(0.65 0.17 185);font-size:0.875rem;font-weight:600;cursor:pointer; }
	.btn-outline-lg:disabled { opacity:0.4;cursor:not-allowed; }
	.btn-outline-lg:hover:not(:disabled) { background:oklch(0.15 0.04 185/0.2); }

	/* States */
	.center-msg { display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:2rem 0;font-size:0.875rem;color:oklch(0.6 0.02 220); }
	.center-actions { display:flex;justify-content:center;padding:1rem 0; }
	.muted { color:oklch(0.5 0.02 220); }
	.no-files { font-size:0.8125rem;color:oklch(0.45 0.02 220);font-style:italic; }
	.error-box { padding:0.75rem;border-radius:0.5rem;background:oklch(0.2 0.08 25/0.25);border:1px solid oklch(0.6 0.22 25/0.4);color:oklch(0.8 0.12 25);font-size:0.875rem; }

	/* Tooltip */
	.tooltip { position:absolute;z-index:40;bottom:calc(100% + 0.5rem);left:50%;transform:translateX(-50%);white-space:normal;max-width:18rem;padding:0.5rem 0.75rem;border-radius:0.5rem;background:oklch(0.08 0.02 220);border:1px solid oklch(0.3 0.03 220/0.5);color:oklch(0.8 0.015 224);font-size:0.875rem;line-height:1.4;box-shadow:0 4px 12px oklch(0 0 0/0.4);pointer-events:none; }
</style>
