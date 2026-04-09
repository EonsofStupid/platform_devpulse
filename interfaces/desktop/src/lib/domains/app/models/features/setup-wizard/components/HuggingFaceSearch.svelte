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
	<h3 class="hf-title"><Search size={18} /> Search HuggingFace</h3>
	<p class="hf-desc">Find AI models from thousands of open-source options</p>

	<!-- Search input — full width, prominent -->
	<div class="search-row">
		<input
			type="text"
			bind:value={searchInput}
			placeholder="Search for models (e.g. Qwen3, Llama, Mistral)..."
			class="search-input"
			onkeydown={handleInputKeydown}
			aria-label="Search HuggingFace for models"
		/>
	</div>
	<button class="btn-search-main" onclick={handleSearch} disabled={!searchInput.trim()} aria-label="Search">
		<Search size={16} /> Search HuggingFace
	</button>

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

	<!-- Loading — prominent centered feedback -->
	{#if searchState.searching}
		<div class="search-loading">
			<Spinner size="sm" />
			<span class="loading-text">Searching HuggingFace for "{searchInput}"...</span>
			<span class="loading-hint">This usually takes a few seconds</span>
		</div>
	{/if}

	<!-- Error — with action buttons (Commandment #8) -->
	{#if searchState.error}
		<div class="error-box">
			<span class="error-text">{searchState.error}</span>
			<div class="error-actions">
				<button class="btn-accent" onclick={handleSearch}>Retry</button>
				<button class="btn-ghost" onclick={() => { searchInput = ""; }}>Clear</button>
			</div>
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
		<div class="empty-search">
			<Search size={28} />
			<span class="empty-title">No models found for "{searchState.query}"</span>
			<span class="empty-hint">Try a different search term</span>
			<div class="empty-suggestions">
				<span class="suggest-label">Popular searches:</span>
				<button class="suggest-btn" onclick={() => { searchInput = "Qwen3"; handleSearch(); }}>Qwen3</button>
				<button class="suggest-btn" onclick={() => { searchInput = "Llama"; handleSearch(); }}>Llama</button>
				<button class="suggest-btn" onclick={() => { searchInput = "Mistral"; handleSearch(); }}>Mistral</button>
				<button class="suggest-btn" onclick={() => { searchInput = "Phi"; handleSearch(); }}>Phi</button>
			</div>
		</div>
	{/if}

	<!-- No search yet — guide the user -->
	{#if !searchState.query && !searchState.searching}
		<div class="welcome-search">
			<Search size={32} />
			<span class="welcome-title">Search for AI models to download</span>
			<span class="welcome-hint">Type a model name above and click Search</span>
			<div class="welcome-suggestions">
				<span class="suggest-label">Try one of these:</span>
				<button class="suggest-btn" onclick={() => { searchInput = "Qwen3"; handleSearch(); }}>Qwen3</button>
				<button class="suggest-btn" onclick={() => { searchInput = "Llama"; handleSearch(); }}>Llama</button>
				<button class="suggest-btn" onclick={() => { searchInput = "Mistral"; handleSearch(); }}>Mistral</button>
				<button class="suggest-btn" onclick={() => { searchInput = "Phi"; handleSearch(); }}>Phi</button>
			</div>
			<div class="format-help">
				<span class="help-title">What are GGUF and SafeTensors?</span>
				<span class="help-text"><strong>GGUF</strong> = Single file, ready to use. Best for most users.</span>
				<span class="help-text"><strong>SafeTensors</strong> = May have multiple parts. Used for very large models.</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.hf-section { display: flex; flex-direction: column; gap: 0.75rem; }
	.hf-title {
		display: flex; align-items: center; gap: 0.5rem;
		font-size: 1.125rem; font-weight: 800; color: var(--wiz-text); margin: 0;
	}

	/* Search */
	.search-row { display: flex; gap: 0.5rem; }
	.search-input {
		flex: 1; padding: 0.625rem 0.875rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: var(--wiz-inset);
		color: var(--wiz-text); font-size: var(--wiz-text-sm); outline: none;
	}
	.search-input::placeholder { color: var(--wiz-text-muted); }
	.search-input:focus { border-color: var(--wiz-border-focus); }

	/* Format tabs */
	.format-tabs {
		display: flex; gap: 0.25rem; padding: 0.25rem;
		background: var(--wiz-inset); border-radius: var(--wiz-radius-md); position: relative;
	}
	.format-tab {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 0.875rem; border-radius: var(--wiz-radius-sm);
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-sm); font-weight: 600; cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.format-tab.active { background: var(--wiz-fill-cyan); color: var(--wiz-cyan); }
	.format-tab:hover:not(.active) { background: var(--wiz-card); }

	/* Results */
	.result-count { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); }
	.result-card {
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
		border-radius: var(--wiz-radius-lg); padding: 1rem;
		display: flex; flex-direction: column; gap: 0.75rem;
	}
	.result-header { display: flex; align-items: flex-start; gap: 0.75rem; }
	.result-meta { flex: 1; min-width: 0; }
	.result-name { display: block; font-size: 0.9375rem; font-weight: 700; color: var(--wiz-text); }
	.result-author { display: block; font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); }
	.result-stats { display: flex; gap: 0.75rem; flex-shrink: 0; }
	.stat { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); }
	.pipeline-badge {
		display: inline-block; padding: 0.125rem 0.5rem; border-radius: var(--wiz-radius-sm);
		background: var(--wiz-void-800); color: var(--wiz-text-sub);
		font-size: var(--wiz-text-xs); align-self: flex-start;
	}

	/* Format section headers */
	.format-section {
		display: flex; flex-direction: column; gap: 0.125rem;
		padding-top: 0.5rem; border-top: 1px solid var(--wiz-border);
	}
	.format-label {
		display: flex; align-items: center; gap: 0.375rem;
		font-size: var(--wiz-text-sm); font-weight: 700; color: var(--wiz-text-sub);
	}
	.format-hint { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	/* File rows */
	.file-row {
		background: var(--wiz-card-raised); border-radius: var(--wiz-radius-md);
		padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;
	}
	.file-row:hover { border-color: var(--wiz-border-focus); }
	.file-info { display: flex; flex-direction: column; gap: 0.25rem; }
	.file-name {
		font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.file-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; align-items: center; }

	/* SafeTensor shards */
	.shard-group {
		background: var(--wiz-card-raised); border-radius: var(--wiz-radius-md);
		padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;
	}
	.shard-summary { display: flex; align-items: center; gap: 0.75rem; }
	.shard-total { font-size: var(--wiz-text-sm); font-weight: 600; color: var(--wiz-text); }
	.shard-list {
		display: flex; flex-direction: column; gap: 0.125rem; padding: 0.5rem;
		background: var(--wiz-inset); border-radius: var(--wiz-radius-sm);
		max-height: 8rem; overflow-y: auto;
	}
	.shard-item { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); font-family: monospace; }

	/* Slot chips */
	.slot-chips { display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; }
	.slot-label { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.slot-chip {
		padding: 0.25rem 0.625rem; border-radius: var(--wiz-radius-full);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-sub); font-size: var(--wiz-text-xs); font-weight: 600;
		cursor: pointer; transition: all var(--wiz-duration-fast);
	}
	.slot-chip.selected {
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		border-color: var(--wiz-cyan);
	}
	.slot-chip:hover:not(.selected) { background: var(--wiz-card); }

	/* Tags */
	.tag {
		font-size: var(--wiz-text-xs); padding: 0.125rem 0.5rem;
		border-radius: var(--wiz-radius-sm); background: var(--wiz-void-800);
		color: var(--wiz-text-sub);
	}
	.tag-muted { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.fit-badge { font-size: var(--wiz-text-xs); font-weight: 600; }

	/* Disk warning */
	.disk-warn {
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-sm);
		background: var(--wiz-fill-ember); border: 1px solid var(--wiz-ember-600);
		color: var(--wiz-ember-200); font-size: var(--wiz-text-xs);
	}

	/* Buttons */
	.btn-accent {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer; align-self: flex-end;
	}
	.btn-accent:hover { filter: brightness(1.15); }
	.btn-accent:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-outline-lg {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.625rem 1.5rem; border-radius: var(--wiz-radius-lg);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-cyan); font-size: var(--wiz-text-sm); font-weight: 600; cursor: pointer;
	}
	.btn-outline-lg:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn-outline-lg:hover:not(:disabled) { background: var(--wiz-fill-cyan); }

	/* Description */
	.hf-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; }

	/* Main search button — full width, prominent */
	.btn-search-main {
		display: flex; align-items: center; justify-content: center; gap: 0.5rem;
		width: 100%; padding: 0.75rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: 0.9375rem; font-weight: 700; cursor: pointer;
		transition: all var(--wiz-duration-fast);
	}
	.btn-search-main:hover { filter: brightness(1.15); }
	.btn-search-main:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Ghost button for error actions */
	.btn-ghost {
		padding: 0.375rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-xs); cursor: pointer;
	}
	.btn-ghost:hover { color: var(--wiz-text-sub); }

	/* Search loading state */
	.search-loading {
		display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
		padding: 3rem 0; min-height: 10rem; justify-content: center;
	}
	.loading-text { font-size: var(--wiz-text-sm); color: var(--wiz-text); font-weight: 600; }
	.loading-hint { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	/* Error with actions */
	.error-text { font-size: var(--wiz-text-sm); }
	.error-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }

	/* Empty/welcome states */
	.empty-search, .welcome-search {
		display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
		padding: 2.5rem 1rem; color: var(--wiz-text-muted); text-align: center;
	}
	.empty-title, .welcome-title { font-size: 0.9375rem; font-weight: 700; color: var(--wiz-text-sub); }
	.empty-hint, .welcome-hint { font-size: var(--wiz-text-sm); color: var(--wiz-text-muted); }

	/* Suggestion chips */
	.empty-suggestions, .welcome-suggestions {
		display: flex; align-items: center; gap: 0.375rem; flex-wrap: wrap; justify-content: center;
	}
	.suggest-label { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.suggest-btn {
		padding: 0.25rem 0.75rem; border-radius: var(--wiz-radius-full);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-cyan); font-size: var(--wiz-text-xs); font-weight: 600;
		cursor: pointer; transition: all var(--wiz-duration-fast);
	}
	.suggest-btn:hover { background: var(--wiz-fill-cyan); border-color: var(--wiz-cyan); }

	/* Format help */
	.format-help {
		display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.5rem;
		padding: 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
		text-align: left; max-width: 22rem;
	}
	.help-title { font-size: var(--wiz-text-xs); font-weight: 700; color: var(--wiz-text-sub); }
	.help-text { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.help-text strong { color: var(--wiz-text-sub); }

	/* Misc states */
	.center-actions { display: flex; justify-content: center; padding: 1rem 0; }
	.no-files { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); font-style: italic; }
	.error-box {
		padding: 0.75rem; border-radius: var(--wiz-radius-md);
		background: var(--wiz-fill-ember); border: 1px solid var(--wiz-ember-600);
		color: var(--wiz-ember-200); font-size: var(--wiz-text-sm);
	}

	/* Tooltip */
	.tooltip {
		position: absolute; z-index: var(--wiz-z-tooltip);
		bottom: calc(100% + 0.5rem); left: 50%; transform: translateX(-50%);
		white-space: normal; max-width: 18rem; padding: 0.5rem 0.75rem;
		border-radius: var(--wiz-radius-md); background: var(--wiz-overlay);
		border: 1px solid var(--wiz-border-strong); color: var(--wiz-text);
		font-size: var(--wiz-text-sm); line-height: 1.4; box-shadow: var(--wiz-shadow-lg);
		pointer-events: none;
	}
</style>
