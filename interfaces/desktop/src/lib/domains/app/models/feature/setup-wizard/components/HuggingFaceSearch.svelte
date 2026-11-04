<!--
  @file HuggingFaceSearch.svelte
  Inline HuggingFace search. NOT a popup. Renders below slot cards.
  Search, filter by format (GGUF/SafeTensors), download per-file with slot selection.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { SearchField } from "@devpulse/coldlight/components/search-field";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { invoke } from "@tauri-apps/api/core";
import { Download, FileText, Layers, Search } from "lucide-svelte";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { searchState } from "../../../data-access/search.state.svelte.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatMb,
	friendlySlotLabel,
} from "../../../util/models.types.js";
import type { BrowseCopy, WizardCopy } from "../wizard.types.js";

const DEFAULT_BROWSE_COPY: BrowseCopy = {
	title: "Find Models",
	subtitle: "Browse models on your computer or search HuggingFace.",
	recommended_tab_label: "Recommended",
	local_tab_label: "On Your Computer",
	online_tab_label: "Search HuggingFace",
	local_browse_tab_label: "Local Browse",
	search_panel_description: "Find AI models from thousands of open-source options.",
	search_placeholder: "Search for models (e.g. Qwen3, Llama, Mistral)...",
	search_input_aria: "Search HuggingFace for models",
	search_button_label: "Search HuggingFace",
	all_formats_label: "All Formats",
	all_formats_tooltip: "Show every supported model file format.",
	no_results_title: "No models found",
	no_results_title_template: 'No models found for "{query}"',
	no_results_hint: "Try a different search term",
	welcome_search_title: "Search for AI models to download",
	welcome_search_hint: "Type a model name above and click Search",
	popular_searches_label: "Popular searches:",
	try_one_of_these_label: "Try one of these:",
	format_help_title: "What are GGUF and SafeTensors?",
	format_gguf_help: "Single file, ready to use. Best for most local setups.",
	format_safetensors_help: "May have multiple parts. All shards download together as one model.",
	search_loading_template: 'Searching HuggingFace for "{query}"...',
	search_loading_hint: "This usually takes a few seconds.",
	retry_label: "Retry",
	clear_label: "Clear",
	result_label_singular: "result",
	result_label_plural: "results",
	gguf_section_label: "GGUF Files",
	safetensors_section_label: "SafeTensors",
	shard_count_template: "{count} shard{plural}",
	all_shards_summary_template: "{count} shard{plural}, {size} total",
	install_to_label: "Install to",
	download_to_template: "Download to {slot}",
	downloading_label: "Downloading...",
	download_all_shards_template: "Download All Shards to {slot}",
	downloading_all_shards_label: "Downloading all shards...",
	disk_space_warning_template: "Not enough disk space. Need {needed}, only {free} free.",
	no_format_files_template: "No {format} files in this repo",
	import_button_label: "Import Model from File",
	importing_label: "Importing — please wait...",
	load_more_label: "Load More Results",
	loading_more_label: "Loading more...",
};

const POPULAR_SEARCHES = ["Qwen3", "Llama", "Mistral", "Phi"];
const SEARCH_TRUTH_CHIPS = [
	"Kernel-backed search",
	"Real queue downloads",
	"Slot-aware install targets",
];

interface Props {
	copy?: BrowseCopy | null;
	onDownload: (repoId: string, filename: string, targetSlot: string) => Promise<void>;
}

let { copy = null, onDownload }: Props = $props();

let searchInput = $state("");
let downloadingFile = $state<string | null>(null);
let selectedSlotForDownload = $state<Record<string, string>>({});
let formatTab = $state<"gguf" | "safetensors" | "all">("all");
let tooltipVisible = $state<string | null>(null);
let tooltipTimer = $state<ReturnType<typeof setTimeout> | null>(null);
let browseCopy = $state<BrowseCopy>(DEFAULT_BROWSE_COPY);

let copyRequested = false;

$effect(() => {
	if (copy) {
		browseCopy = copy;
		return;
	}
	if (copyRequested) return;
	copyRequested = true;
	void loadBrowseCopy();
});

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

async function loadBrowseCopy(): Promise<void> {
	try {
		const wizardCopy = await invoke<WizardCopy>("get_wizard_copy");
		browseCopy = wizardCopy.browse;
	} catch (error) {
		console.warn("[wizard][hf-search] failed to load browse copy", error);
	}
}

function applyTemplate(template: string, values: Record<string, number | string>): string {
	let resolved = template;
	Object.entries(values).forEach(([key, value]) => {
		resolved = resolved.replaceAll(`{${key}}`, String(value));
	});
	return resolved;
}

function pluralSuffix(count: number): string {
	return count === 1 ? "" : "s";
}

async function handleSearch(): Promise<void> {
	const query = searchInput.trim();
	if (!query) {
		clearSearch();
		return;
	}
	searchInput = query;
	await searchState.submitQuery(query);
}

function handleInputKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter") {
		e.preventDefault();
		void handleSearch();
	}
}

function clearSearch(): void {
	searchInput = "";
	searchState.clear();
}

function runSuggestedSearch(suggestion: string): void {
	searchInput = suggestion;
	void searchState.submitQuery(suggestion);
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
	<div class="search-hero">
		<div class="search-hero-copy">
			<Text size="xs" weight="bold" class="search-kicker">Kernel Search</Text>
			<div class="search-title-row">
				<Search size={18} />
				<Text size="lg" weight="bold" class="hf-title">{browseCopy.online_tab_label}</Text>
			</div>
			<Text size="sm" class="hf-desc">{browseCopy.search_panel_description}</Text>
		</div>
		<div class="search-pill-row" aria-label="Search truths">
			{#each SEARCH_TRUTH_CHIPS as chip (chip)}
				<span class="search-pill">{chip}</span>
			{/each}
		</div>
	</div>

	<div class="search-shell">
		<SearchField
			class="search-field"
			preset="glass"
			size="lg"
			value={searchInput}
			onValueChange={(value) => {
				searchInput = value;
				if (!value.trim()) {
					searchState.clear();
				}
			}}
			onClear={clearSearch}
			placeholder={browseCopy.search_placeholder}
			aria-label={browseCopy.search_input_aria}
			onkeydown={handleInputKeydown}
		/>
		<Button
			variant="primary"
			size="md"
			class="search-submit"
			onclick={() => void handleSearch()}
			disabled={!searchInput.trim() || searchState.searching}
		>
			{#if searchState.searching}
				<Spinner size="sm" /> Searching...
			{:else}
				<Search size={16} /> {browseCopy.search_button_label}
			{/if}
		</Button>
	</div>

	<div class="quick-search-row">
		<span class="suggest-label">{browseCopy.popular_searches_label}</span>
		{#each POPULAR_SEARCHES as suggestion (suggestion)}
			<button class="suggest-btn" onclick={() => runSuggestedSearch(suggestion)}>{suggestion}</button>
		{/each}
	</div>

	<!-- Format filter tabs -->
	<div class="format-tabs">
		<button class="format-tab" class:active={formatTab === "all"} onclick={() => (formatTab = "all")}
			onmouseenter={() => showTooltip("tab-all")} onmouseleave={hideTooltip}>
			{browseCopy.all_formats_label}
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
			<div class="tooltip">{browseCopy.all_formats_tooltip}</div>
		{/if}
		{#if tooltipVisible === "tab-gguf"}
			<div class="tooltip">{browseCopy.format_gguf_help}</div>
		{/if}
		{#if tooltipVisible === "tab-st"}
			<div class="tooltip">{browseCopy.format_safetensors_help}</div>
		{/if}
	</div>

	<!-- Loading — prominent centered feedback -->
	{#if searchState.searching}
		<div class="search-loading">
			<Spinner size="sm" />
			<span class="loading-text">{applyTemplate(browseCopy.search_loading_template, { query: searchState.query || searchInput })}</span>
			<span class="loading-hint">{browseCopy.search_loading_hint}</span>
		</div>
	{/if}

	<!-- Error — with action buttons (Commandment #8) -->
	{#if searchState.error}
		<div class="error-box">
			<span class="error-text">{searchState.error}</span>
			<div class="error-actions">
				<button class="btn-accent" onclick={() => void handleSearch()}>{browseCopy.retry_label}</button>
				<button class="btn-ghost" onclick={clearSearch}>{browseCopy.clear_label}</button>
			</div>
		</div>
	{/if}

	<!-- Results -->
	{#if !searchState.searching && searchState.results.length > 0}
		<span class="result-count">
			{searchState.results.length}
			{searchState.results.length === 1
				? ` ${browseCopy.result_label_singular}`
				: ` ${browseCopy.result_label_plural}`}
		</span>

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
							<span class="format-label"><FileText size={14} /> {browseCopy.gguf_section_label} ({ggufOnly.length})</span>
							<span class="format-hint">{browseCopy.format_gguf_help}</span>
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
									<span class="slot-label">{browseCopy.install_to_label}:</span>
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
									{#if isDownloading}<Spinner size="sm" /> {browseCopy.downloading_label}
									{:else}<Download size={14} /> {applyTemplate(browseCopy.download_to_template, { slot: friendlySlotLabel(selectedSlot) })}{/if}
								</button>

								<!-- Disk space warning -->
								{#if hardwareState.diskFreeMb && fileSizeMb > hardwareState.diskFreeMb * 0.9}
									<div class="disk-warn">
										{applyTemplate(browseCopy.disk_space_warning_template, {
											needed: formatMb(fileSizeMb),
											free: formatMb(hardwareState.diskFreeMb),
										})}
									</div>
								{/if}
							</div>
						{/each}
					{/if}

					<!-- SafeTensors section -->
					{#if hasSafetensors && (formatTab === "all" || formatTab === "safetensors")}
						<div class="format-section">
							<span class="format-label"><Layers size={14} /> {browseCopy.safetensors_section_label} ({applyTemplate(browseCopy.shard_count_template, {
								count: safetensorShards.length,
								plural: pluralSuffix(safetensorShards.length),
							})})</span>
							<span class="format-hint">{browseCopy.format_safetensors_help}</span>
						</div>
						{@const totalSizeMb = safetensorShards.reduce((sum, f) => sum + Math.round(f.size_bytes / (1024 * 1024)), 0)}
						{@const fit = calculateFit(totalSizeMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
						{@const groupKey = `${result.repo_id}/safetensors`}
						{@const isDownloading = downloadingFile === groupKey}
						{@const selectedSlot = selectedSlotForDownload[groupKey] ?? modelsState.userSlots[0]?.id ?? "chat.brain"}

						<div class="shard-group">
							<div class="shard-summary">
								<span class="shard-total">{applyTemplate(browseCopy.all_shards_summary_template, {
									count: safetensorShards.length,
									plural: pluralSuffix(safetensorShards.length),
									size: formatMb(totalSizeMb),
								})}</span>
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
								<span class="slot-label">{browseCopy.install_to_label}:</span>
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
								{#if isDownloading}<Spinner size="sm" /> {browseCopy.downloading_all_shards_label}
								{:else}<Download size={14} /> {applyTemplate(browseCopy.download_all_shards_template, { slot: friendlySlotLabel(selectedSlot) })}{/if}
							</button>

							{#if hardwareState.diskFreeMb && totalSizeMb > hardwareState.diskFreeMb * 0.9}
								<div class="disk-warn">
									{applyTemplate(browseCopy.disk_space_warning_template, {
										needed: formatMb(totalSizeMb),
										free: formatMb(hardwareState.diskFreeMb),
									})}
								</div>
							{/if}
						</div>
					{/if}

					<!-- No matching files for this format tab -->
					{#if ggufFiles.length === 0 && formatTab !== "all"}
						<span class="no-files">{applyTemplate(browseCopy.no_format_files_template, {
							format: formatTab === "gguf" ? "GGUF" : "SafeTensors",
						})}</span>
					{/if}
				</div>
			{/if}
		{/each}

		<!-- Load More -->
		{#if searchState.hasMore}
			<div class="center-actions">
				<button class="btn-outline-lg" onclick={() => searchState.loadMore()} disabled={searchState.loadingMore} aria-label="Load more search results">
					{#if searchState.loadingMore}<Spinner size="sm" /> {browseCopy.loading_more_label}
					{:else}{browseCopy.load_more_label}{/if}
				</button>
			</div>
		{/if}
	{/if}

	<!-- Empty state -->
	{#if !searchState.searching && searchState.query && searchState.results.length === 0 && !searchState.error}
		<div class="empty-search">
			<Search size={28} />
			<span class="empty-title">{applyTemplate(browseCopy.no_results_title_template, { query: searchState.query })}</span>
			<span class="empty-hint">{browseCopy.no_results_hint}</span>
			<div class="empty-suggestions">
				<span class="suggest-label">{browseCopy.popular_searches_label}</span>
				{#each POPULAR_SEARCHES as suggestion (suggestion)}
					<button class="suggest-btn" onclick={() => runSuggestedSearch(suggestion)}>{suggestion}</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- No search yet — guide the user -->
	{#if !searchState.query && !searchState.searching}
		<div class="welcome-search">
			<Search size={32} />
			<span class="welcome-title">{browseCopy.welcome_search_title}</span>
			<span class="welcome-hint">{browseCopy.welcome_search_hint}</span>
			<div class="welcome-suggestions">
				<span class="suggest-label">{browseCopy.try_one_of_these_label}</span>
				{#each POPULAR_SEARCHES as suggestion (suggestion)}
					<button class="suggest-btn" onclick={() => runSuggestedSearch(suggestion)}>{suggestion}</button>
				{/each}
			</div>
			<div class="format-help">
				<span class="help-title">{browseCopy.format_help_title}</span>
				<span class="help-text"><strong>GGUF</strong> - {browseCopy.format_gguf_help}</span>
				<span class="help-text"><strong>SafeTensors</strong> - {browseCopy.format_safetensors_help}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.hf-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.search-hero {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 1rem;
		padding: 1rem 1.125rem;
		border-radius: 1.125rem;
		background:
			linear-gradient(135deg, color-mix(in oklch, var(--accent-cyan-fill) 90%, transparent), transparent 54%),
			linear-gradient(330deg, color-mix(in oklch, var(--accent-purple-fill) 82%, transparent), transparent 62%),
			var(--glass-deep);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-cyan-main) 28%, transparent);
		box-shadow: var(--card-box-shadow);
	}

	.search-hero-copy {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	:global(.search-kicker) {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent-cyan-main);
	}

	.search-title-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-primary);
	}

	:global(.hf-title) {
		color: var(--text-primary);
	}

	:global(.hf-desc) {
		color: var(--text-secondary);
	}

	.search-pill-row {
		display: flex;
		align-items: flex-start;
		justify-content: flex-end;
		gap: 0.375rem;
		flex-wrap: wrap;
		max-width: 20rem;
	}

	.search-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.3125rem 0.625rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--surface-base, #0c1220) 84%, transparent);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-cyan-main) 20%, transparent);
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 700;
	}

	.search-shell {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.75rem;
		align-items: center;
	}

	:global(.search-field) {
		min-width: 0;
	}

	:global(.search-submit) {
		min-width: 11rem;
	}

	.quick-search-row,
	.empty-suggestions,
	.welcome-suggestions {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.quick-search-row {
		justify-content: flex-start;
	}

	.suggest-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.suggest-btn {
		padding: 0.3125rem 0.75rem;
		border-radius: 999px;
		border: var(--border-width-thin) solid var(--border-subtle);
		background: color-mix(in oklch, var(--glass-standard) 84%, transparent);
		color: var(--accent-cyan-main);
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--duration-fast);
	}

	.suggest-btn:hover {
		border-color: var(--accent-cyan-main);
		background: color-mix(in oklch, var(--accent-cyan-fill) 88%, transparent);
		color: var(--text-primary);
	}

	.format-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		position: relative;
	}

	.format-tab {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 999px;
		border: var(--border-width-thin) solid var(--border-subtle);
		background: color-mix(in oklch, var(--glass-standard) 84%, transparent);
		color: var(--text-secondary);
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--duration-fast);
	}

	.format-tab.active,
	.format-tab:hover {
		border-color: var(--accent-cyan-main);
		background: color-mix(in oklch, var(--accent-cyan-fill) 88%, transparent);
		color: var(--text-primary);
	}

	.search-loading,
	.empty-search,
	.welcome-search {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem 1rem;
		border-radius: 1rem;
		background: var(--glass-deep);
		border: var(--border-width-thin) solid var(--border-subtle);
		text-align: center;
	}

	.loading-text,
	.empty-title,
	.welcome-title {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.loading-hint,
	.empty-hint,
	.welcome-hint {
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.error-box {
		padding: 0.875rem 1rem;
		border-radius: 1rem;
		background: color-mix(in oklch, var(--signal-error) 12%, transparent);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--signal-error) 40%, transparent);
		color: var(--text-primary);
	}

	.error-text {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.error-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.625rem;
		flex-wrap: wrap;
	}

	.result-count {
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.result-card {
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
		padding: 1rem;
		border-radius: 1rem;
		background: var(--glass-deep);
		border: var(--border-width-thin) solid var(--border-subtle);
		box-shadow: var(--card-box-shadow);
	}

	.result-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		justify-content: space-between;
	}

	.result-meta {
		flex: 1;
		min-width: 0;
	}

	.result-name {
		display: block;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.result-author,
	.stat,
	.format-hint,
	.tag-muted,
	.no-files {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.result-stats {
		display: flex;
		gap: 0.75rem;
		flex-shrink: 0;
	}

	.pipeline-badge {
		display: inline-block;
		align-self: flex-start;
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--accent-purple-fill) 88%, transparent);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-purple-main) 30%, transparent);
		color: var(--text-secondary);
		font-size: 0.6875rem;
		font-weight: 700;
	}

	.format-section {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding-top: 0.625rem;
		border-top: var(--border-width-thin) solid var(--border-subtle);
	}

	.format-label {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-secondary);
	}

	.file-row,
	.shard-group {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.875rem;
		border-radius: 1rem;
		background: color-mix(in oklch, var(--glass-standard) 84%, transparent);
		border: var(--border-width-thin) solid var(--border-subtle);
		transition: all var(--duration-fast);
	}

	.file-row:hover,
	.shard-group:hover {
		border-color: color-mix(in oklch, var(--accent-cyan-main) 36%, transparent);
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.file-name,
	.shard-total {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-tags,
	.shard-summary,
	.slot-chips {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.shard-list {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.625rem 0.75rem;
		background: color-mix(in oklch, var(--surface-base, #0c1220) 82%, transparent);
		border-radius: 0.875rem;
		border: var(--border-width-thin) solid var(--border-subtle);
		max-height: 8rem;
		overflow-y: auto;
	}

	.shard-item {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-family: var(--font-mono, monospace);
	}

	.slot-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.slot-chip {
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		border: var(--border-width-thin) solid var(--border-subtle);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--duration-fast);
	}

	.slot-chip.selected,
	.slot-chip:hover {
		border-color: var(--accent-cyan-main);
		background: color-mix(in oklch, var(--accent-cyan-fill) 88%, transparent);
		color: var(--text-primary);
	}

	.tag {
		font-size: 0.6875rem;
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--glass-standard) 86%, transparent);
		border: var(--border-width-thin) solid var(--border-subtle);
		color: var(--text-secondary);
	}

	.fit-badge {
		font-size: 0.6875rem;
		font-weight: 700;
	}

	.disk-warn {
		padding: 0.625rem 0.75rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--accent-gold-main) 12%, transparent);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-gold-main) 38%, transparent);
		color: var(--text-secondary);
		font-size: 0.75rem;
	}

	.btn-accent,
	.btn-outline-lg,
	.btn-ghost {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		border-radius: 0.875rem;
		font-size: 0.8125rem;
		font-weight: 700;
		cursor: pointer;
		transition: all var(--duration-fast);
	}

	.btn-accent {
		padding: 0.5625rem 1rem;
		border: none;
		background: var(--accent-cyan-main);
		color: var(--surface-base, #0c1220);
		align-self: flex-end;
	}

	.btn-accent:hover:not(:disabled) {
		filter: brightness(1.08);
	}

	.btn-outline-lg {
		padding: 0.625rem 1.25rem;
		border: var(--border-width-thin) solid var(--border-subtle);
		background: color-mix(in oklch, var(--glass-standard) 80%, transparent);
		color: var(--text-primary);
	}

	.btn-outline-lg:hover:not(:disabled) {
		border-color: var(--accent-cyan-main);
		background: color-mix(in oklch, var(--accent-cyan-fill) 88%, transparent);
	}

	.btn-ghost {
		padding: 0.5rem 0.875rem;
		border: var(--border-width-thin) solid transparent;
		background: transparent;
		color: var(--text-muted);
	}

	.btn-ghost:hover {
		border-color: var(--border-subtle);
		color: var(--text-primary);
	}

	.btn-accent:disabled,
	.btn-outline-lg:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.format-help {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 0.25rem;
		padding: 0.875rem 1rem;
		border-radius: 1rem;
		background: color-mix(in oklch, var(--glass-standard) 84%, transparent);
		border: var(--border-width-thin) solid var(--border-subtle);
		text-align: left;
		max-width: 24rem;
	}

	.help-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.help-text {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.help-text strong {
		color: var(--text-secondary);
	}

	.center-actions {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0 0;
	}

	.tooltip {
		position: absolute;
		z-index: 220;
		top: calc(100% + 0.5rem);
		left: 0;
		max-width: 18rem;
		padding: 0.625rem 0.75rem;
		border-radius: 0.875rem;
		background: color-mix(in oklch, var(--surface-overlay) 94%, transparent);
		border: var(--border-width-thin) solid color-mix(in oklch, var(--accent-cyan-main) 24%, transparent);
		color: var(--text-secondary);
		font-size: 0.75rem;
		line-height: 1.45;
		box-shadow: var(--popover-box-shadow);
		pointer-events: none;
	}

	@media (max-width: 48rem) {
		.search-hero,
		.search-shell,
		.result-header,
		.file-row,
		.shard-group {
			grid-template-columns: 1fr;
			flex-direction: column;
			align-items: flex-start;
		}

		.search-pill-row {
			justify-content: flex-start;
			max-width: none;
		}

		:global(.search-submit) {
			width: 100%;
		}

		.btn-accent {
			align-self: stretch;
		}
	}
</style>
