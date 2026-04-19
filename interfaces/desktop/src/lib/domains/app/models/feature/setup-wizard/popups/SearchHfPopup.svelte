<!--
  @file SearchHFPopup.svelte
  HuggingFace search modal with download trigger.
  Absorbs: HuggingFaceSearch search logic, SlotSwapPopup "Search" tab.
-->
<script lang="ts">
import { Download, Heart, Layers, Search, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { searchState } from "../../../data-access/search.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import { downloadAndAssignFile } from "../wizard.service.js";
import { getSlotLabel } from "../wizard.types.js";

type FormatFilter = "all" | "gguf" | "safetensors";

/** Suggested searches filtered by slot capability. */
const CAPABILITY_SEARCHES: Record<string, string[]> = {
	TextGeneration: ["Qwen3", "Llama", "Mistral", "Phi"],
	Embedding: ["nomic-embed", "bge", "gte", "e5"],
	Reranking: ["bge-reranker", "jina-reranker"],
	VisionEmbedding: ["siglip", "clip", "nomic-embed-vision"],
	SpeechToText: ["Whisper", "whisper"],
	TextToSpeech: ["Kokoro", "piper"],
	VisionLanguage: ["Qwen3-VL", "LLaVA", "moondream"],
};
const FALLBACK_SEARCHES = ["Qwen3", "Llama", "Mistral", "Phi", "Whisper", "Kokoro"];

interface Props {
	slotId: SlotId;
	capability: string;
	open: boolean;
	onDownloadStarted: () => void;
	onClose: () => void;
}

let { slotId, capability, open, onDownloadStarted, onClose }: Props = $props();

let searchInput = $state("");
let formatFilter = $state<FormatFilter>("all");
let downloadingFile = $state<string | null>(null);
let assignedFile = $state<string | null>(null);

const slotLabel = $derived(getSlotLabel(slotId)?.name ?? slotId);
const suggestedSearches = $derived(CAPABILITY_SEARCHES[capability] ?? FALLBACK_SEARCHES);

function formatDownloads(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
	return `${n}`;
}

async function handleSearch(): Promise<void> {
	const query = searchInput.trim();
	if (!query) return;
	searchInput = query;
	await searchState.submitQuery(query);
}

function handleInputKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter") {
		e.preventDefault();
		void handleSearch();
	}
}

function runSuggested(term: string): void {
	searchInput = term;
	void searchState.submitQuery(term);
}

async function handleDownload(repoId: string, filename: string): Promise<void> {
	const fileKey = `${repoId}/${filename}`;
	downloadingFile = fileKey;
	assignedFile = null;
	try {
		// Download → scan → assign to this slot. All in one call.
		await downloadAndAssignFile(repoId, filename, slotId);
		assignedFile = filename;
		onDownloadStarted();
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		const { toast } = await import("svelte-sonner");
		toast.error(`Download failed: ${msg}`);
	} finally {
		downloadingFile = null;
	}
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Escape") onClose();
}

// Filter results by format tab
const filteredResults = $derived.by(() => {
	if (formatFilter === "all") return searchState.results;
	return searchState.results.filter((r) => {
		if (formatFilter === "gguf") return r.gguf_files.length > 0;
		// safetensors — show repos that have any safetensor-tagged files
		return r.tags.some((t) => t.includes("safetensors"));
	});
});
</script>

{#if open}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="popup-backdrop" onclick={onClose} onkeydown={handleKeydown}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div class="popup-panel" onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search HuggingFace — {slotLabel}">
		<div class="popup-header">
			<Heading level={3} size="lg">Search HuggingFace — {slotLabel}</Heading>
			<Button preset="button-ghost" size="sm" onclick={onClose} aria-label="Close">
				<X size={16} />
			</Button>
		</div>

		<div class="search-bar">
			<input
				type="text"
				class="search-input"
				placeholder="Search for models (e.g. Qwen3, Llama, Whisper)..."
				bind:value={searchInput}
				onkeydown={handleInputKeydown}
				aria-label="Search HuggingFace for models"
			/>
			<Button preset="button-primary" size="sm" onclick={handleSearch} disabled={searchState.searching}>
				{#if searchState.searching}
					<Spinner size="xs" />
				{:else}
					<Search size={14} />
				{/if}
				Search
			</Button>
		</div>

		{#if !searchState.query && searchState.results.length === 0}
			<div class="suggestions">
				<Text size="xs" class="suggest-label">Popular searches:</Text>
				<div class="suggest-chips">
					{#each suggestedSearches as term}
						<button class="suggest-chip" onclick={() => runSuggested(term)}>{term}</button>
					{/each}
				</div>
			</div>
		{/if}

		<div class="filter-bar">
			{#each (["all", "gguf", "safetensors"] as const) as fmt}
				<button class="format-tab" class:active={formatFilter === fmt} onclick={() => (formatFilter = fmt)}>
					{fmt === "all" ? "All Formats" : fmt === "gguf" ? "GGUF" : "SafeTensors"}
				</button>
			{/each}
			{#if searchState.results.length > 0}
				<Text size="xs" class="result-count">
					{filteredResults.length} result{filteredResults.length === 1 ? "" : "s"}
				</Text>
			{/if}
		</div>

		<div class="results-list">
			{#if searchState.searching && searchState.results.length === 0}
				<div class="centered-state">
					<Spinner size="md" tone="accent" />
					<Text size="sm">Searching HuggingFace...</Text>
				</div>
			{:else if searchState.error}
				<div class="centered-state">
					<Text size="sm" class="error-text">{searchState.error}</Text>
					<Button preset="button-secondary" size="sm" onclick={handleSearch}>Retry</Button>
				</div>
			{:else if searchState.query && filteredResults.length === 0 && !searchState.searching}
				<div class="centered-state">
					<Text size="sm">No models found for "{searchState.query}"</Text>
					<Text size="xs" class="hint-text">Try a different search term or change the format filter.</Text>
				</div>
			{:else}
				{#each filteredResults as result (result.repo_id)}
					<div class="result-card">
						<div class="result-header">
							<div class="result-info">
								<Text size="sm" weight="bold">{result.model_name || result.repo_id}</Text>
								<Text size="xs" class="result-author">{result.author}</Text>
							</div>
							<div class="result-stats">
								<Badge tone="neutral" size="sm">
									<Download size={10} />
									{formatDownloads(Number(result.downloads))}
								</Badge>
								<Badge tone="neutral" size="sm">
									<Heart size={10} />
									{formatDownloads(Number(result.likes))}
								</Badge>
								{#if result.pipeline_tag}
									<Badge tone="informative" size="sm">{result.pipeline_tag}</Badge>
								{/if}
							</div>
						</div>

						{#if result.gguf_files.length > 0 && (formatFilter === "all" || formatFilter === "gguf")}
							<div class="file-section">
								<Text size="xs" weight="bold" class="section-label">GGUF Files</Text>
								{#each result.gguf_files as file}
									{@const fileKey = `${result.repo_id}/${file.filename}`}
									{@const isDownloading = downloadingFile === fileKey}
									<div class="file-row">
										<div class="file-info">
											<Text size="xs" class="file-name">{file.filename}</Text>
											<div class="file-meta">
												{#if file.quant_level}
													<Badge tone="positive" size="sm">{file.quant_level}</Badge>
												{/if}
												<Text size="xs" class="file-size">{formatMb(Number(file.size_bytes) / (1024 * 1024))}</Text>
											</div>
										</div>
										<Button
											preset="button-primary"
											size="sm"
											onclick={() => handleDownload(result.repo_id, file.filename)}
											disabled={isDownloading}
										>
											{#if isDownloading}
												<Spinner size="xs" />
											{:else}
												<Download size={14} />
											{/if}
											Download
										</Button>
									</div>
								{/each}
							</div>
						{/if}

						{#if result.tags.some((t) => t.includes("safetensors")) && (formatFilter === "all" || formatFilter === "safetensors")}
							<div class="file-section">
								<Text size="xs" weight="bold" class="section-label">SafeTensors</Text>
								<div class="file-row">
									<div class="file-info">
										<Text size="xs" class="file-name">{result.repo_id} (all shards)</Text>
									</div>
									<Button
										preset="button-primary"
										size="sm"
										onclick={() => handleDownload(result.repo_id, "model.safetensors")}
										disabled={downloadingFile === `${result.repo_id}/safetensors`}
									>
										{#if isDownloading}
											<Spinner size="xs" />
										{:else}
											<Download size={14} />
										{/if}
										Download
									</Button>
								</div>
							</div>
						{/if}
					</div>
				{/each}

				{#if searchState.hasMore}
					<div class="load-more">
						<Button preset="button-secondary" size="sm" onclick={() => searchState.loadMore()} disabled={searchState.loadingMore}>
							{#if searchState.loadingMore}
								<Spinner size="xs" />
								Loading more...
							{:else}
								Load More Results
							{/if}
						</Button>
					</div>
				{/if}
			{/if}

			{#if assignedFile}
				<div class="assigned-banner">
					<Text size="sm" weight="bold" class="assigned-text">
						✓ {assignedFile} assigned to {slotLabel}
					</Text>
					<Button preset="button-primary" size="sm" onclick={onClose}>
						Done
					</Button>
				</div>
			{/if}

			{#if hardwareState.diskFreeMb < 5000}
				<div class="disk-warning">
					<Text size="xs" class="warning-text">
						Low disk space: {formatMb(hardwareState.diskFreeMb)} free. Large models may not fit.
					</Text>
				</div>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.popup-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		background: oklch(0 0 0 / 0.6);
		backdrop-filter: blur(0.5rem);
	}

	.popup-panel {
		display: flex;
		flex-direction: column;
		width: min(52rem, 92vw);
		max-height: 85vh;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
		border-radius: 1rem;
		box-shadow: var(--shadow-z3);
		overflow: hidden;
	}

	.popup-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
	}

	.search-bar {
		display: flex;
		gap: 0.5rem;
		padding: 0.75rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
	}

	.search-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-raised);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 150ms ease-out;
	}
	.search-input:focus {
		border-color: var(--accent-teal-main);
	}
	.search-input::placeholder {
		color: var(--text-muted);
	}

	.suggestions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
		flex-wrap: wrap;
	}
	:global(.suggest-label) {
		color: var(--text-muted);
	}
	.suggest-chips {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.suggest-chip {
		padding: 0.1875rem 0.5rem;
		border-radius: 999px;
		border: 1px solid var(--border-soft);
		background: transparent;
		color: var(--text-secondary);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all 150ms ease-out;
	}
	.suggest-chip:hover {
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}

	.filter-bar {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1.25rem;
		border-bottom: 1px solid var(--border-soft);
	}

	.format-tab {
		padding: 0.25rem 0.625rem;
		border-radius: 0.375rem;
		border: 1px solid var(--border-soft);
		background: transparent;
		color: var(--text-muted);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 150ms ease-out;
	}
	.format-tab:hover {
		border-color: var(--border-default);
		color: var(--text-secondary);
	}
	.format-tab.active {
		background: var(--surface-raised);
		border-color: var(--accent-teal-main);
		color: var(--accent-teal-main);
	}

	:global(.result-count) {
		margin-left: auto;
		color: var(--text-muted);
	}

	.results-list {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.centered-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 3rem 1rem;
		color: var(--text-muted);
	}
	:global(.error-text) {
		color: var(--signal-error);
	}
	:global(.hint-text) {
		color: var(--text-muted);
	}

	.result-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
	}

	.result-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.result-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.result-author) {
		color: var(--text-muted);
	}

	.result-stats {
		display: flex;
		gap: 0.25rem;
		flex-shrink: 0;
		flex-wrap: wrap;
	}

	.file-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding-left: 0.5rem;
		border-left: 2px solid var(--border-soft);
	}

	:global(.section-label) {
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.file-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		transition: background 150ms ease-out;
	}
	.file-row:hover {
		background: oklch(1 0 0 / 0.03);
	}

	.file-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	:global(.file-name) {
		font-family: var(--font-mono);
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-meta {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	:global(.file-size) {
		color: var(--text-muted);
	}

	.load-more {
		display: flex;
		justify-content: center;
		padding: 0.5rem;
	}

	.disk-warning {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: oklch(0.5 0.15 60 / 0.1);
		border: 1px solid oklch(0.6 0.15 60 / 0.3);
	}
	:global(.warning-text) {
		color: var(--signal-warning);
	}

	.assigned-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		background: oklch(0.45 0.12 155 / 0.15);
		border: 1px solid oklch(0.55 0.12 155 / 0.4);
	}
	:global(.assigned-text) {
		color: var(--signal-success);
	}
</style>
