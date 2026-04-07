<!--
  @file HuggingFaceSearch.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/HuggingFaceSearch

  Inline HuggingFace search section. NOT a popup. Renders in normal flow
  below slot cards. Search, filter, download per-file with slot selection.
-->
<script lang="ts">
import { Download, Search } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Separator } from "$lib/design/components/separator/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { searchState } from "../../../runes/search.runes.svelte.js";
import type { SlotId } from "../../../types/models.types.js";
import {
	calculateFit,
	fitColor,
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

const cardM = $derived(renderForge({ kind: "card", preset: "glass" }));

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
</script>

<div class="flex flex-col gap-4">
	<Text size="lg" weight="bold" color="primary">Search HuggingFace</Text>

	<!-- Search input -->
	<div class="flex gap-2">
		<input
			type="text"
			bind:value={searchInput}
			placeholder="Search for models (e.g. Qwen3, Llama, Mistral)..."
			class="flex-1 rounded-lg px-4 py-2.5 text-base outline-none transition-colors border"
			style="background: var(--surface-base); color: var(--text-primary); border-color: var(--border-subtle);"
			onkeydown={handleInputKeydown}
			aria-label="Search HuggingFace for models"
		/>
		<button
			class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors"
			style="background: var(--accent-teal-main); color: var(--surface-base);"
			onclick={handleSearch}
			aria-label="Search"
		>
			<Search size={16} />
			Search
		</button>
	</div>

	<!-- Loading -->
	{#if searchState.searching}
		<div class="flex items-center gap-3 justify-center py-8">
			<Spinner size="sm" />
			<Text size="sm" color="muted">Searching HuggingFace...</Text>
		</div>
	{/if}

	<!-- Error -->
	{#if searchState.error}
		<div class="rounded-lg p-4 border" style="background: var(--signal-error); border-color: var(--signal-error);">
			<Text size="sm" color="primary">{searchState.error}</Text>
		</div>
	{/if}

	<!-- Results -->
	{#if !searchState.searching && searchState.results.length > 0}
		<Text size="sm" color="muted">{searchState.results.length} result{searchState.results.length === 1 ? "" : "s"}</Text>

		{#each searchState.results as result (result.repo_id)}
			<div
				{...cardM.dataAttrs}
				style={cssVarString(cardM.cssVars)}
				class="hf-result-card rounded-lg p-4"
			>
				<!-- Result header -->
				<div class="flex items-start gap-3 mb-3">
					<div class="flex-1 min-w-0">
						<Text size="base" weight="bold" color="primary">{result.model_name}</Text>
						<Text size="sm" color="muted">{result.author}</Text>
					</div>
					<div class="flex items-center gap-3">
						<Text size="sm" color="muted">↓ {formatDownloads(result.downloads)}</Text>
						<Text size="sm" color="muted">♥ {result.likes}</Text>
					</div>
				</div>

				{#if result.pipeline_tag}
					<Badge variant="neutral" size="sm" class="mb-2">{result.pipeline_tag}</Badge>
				{/if}

				<!-- GGUF files -->
				{#if result.gguf_files.length > 0}
					<Separator class="my-2" />
					<Text size="sm" weight="bold" color="secondary" class="mb-2">
						Available Files ({result.gguf_files.length})
					</Text>

					{#each result.gguf_files as file (file.filename)}
						{@const fileSizeMb = Math.round(file.size_bytes / (1024 * 1024))}
						{@const fit = calculateFit(fileSizeMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
						{@const fitLabel = fit === "green" ? "Fits GPU" : fit === "yellow" ? "CPU only" : "Too large"}
						{@const fileKey = `${result.repo_id}/${file.filename}`}
						{@const isDownloading = downloadingFile === fileKey}
						{@const selectedSlot = selectedSlotForDownload[fileKey] ?? modelsState.userSlots[0]?.id ?? "chat.brain"}

						<div class="gguf-row rounded-lg p-3 mb-2 border" style="border-color: var(--border-subtle);">
							<!-- File info row -->
							<div class="flex items-center gap-3 mb-2">
								<Text size="sm" weight="bold" color="primary" class="flex-1 truncate">{file.filename}</Text>
								{#if file.quant_level}
									<Badge variant="neutral" size="sm">{file.quant_level}</Badge>
								{/if}
								<Text size="sm" color="muted">{formatMb(fileSizeMb)}</Text>
								<Badge
									variant={fit === "green" ? "positive" : fit === "yellow" ? "notice" : "negative"}
									size="sm"
								>
									{fitLabel}
								</Badge>
							</div>

							<!-- Slot selector: inline chip buttons -->
							<div class="flex items-center gap-2 flex-wrap mb-2">
								<Text size="xs" color="muted">Install to:</Text>
								{#each modelsState.userSlots as slot (slot.id)}
									{@const isSelected = selectedSlot === slot.id}
									<button
										class="rounded-full px-3 py-1 text-xs font-bold transition-all border"
										style={isSelected
											? "background: var(--accent-teal-main); color: var(--surface-base); border-color: var(--accent-teal-main);"
											: "background: transparent; color: var(--text-secondary); border-color: var(--border-subtle);"}
										onclick={() => selectSlotForFile(fileKey, slot.id)}
										aria-label="Install to {friendlySlotLabel(slot.id)}"
										aria-pressed={isSelected}
									>
										{friendlySlotLabel(slot.id)}
									</button>
								{/each}
							</div>

							<!-- Download button -->
							<div class="flex justify-end">
								<button
									class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-colors disabled:opacity-40"
									style="background: var(--accent-teal-main); color: var(--surface-base);"
									onclick={() => handleDownloadFile(result.repo_id, file.filename, fileKey)}
									disabled={isDownloading}
									aria-label="Download {file.filename} to {friendlySlotLabel(selectedSlot)}"
								>
									{#if isDownloading}
										<Spinner size="sm" />
										Downloading...
									{:else}
										<Download size={14} />
										Download to {friendlySlotLabel(selectedSlot)}
									{/if}
								</button>
							</div>
						</div>
					{/each}
				{:else}
					<Text size="sm" color="muted" class="italic">No GGUF files in this repo</Text>
				{/if}
			</div>
		{/each}

		<!-- Load More -->
		{#if searchState.hasMore}
			<div class="flex justify-center py-4">
				<button
					class="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-bold border transition-colors disabled:opacity-40"
					style="border-color: var(--accent-teal-main); color: var(--accent-teal-main);"
					onclick={() => searchState.loadMore()}
					disabled={searchState.loadingMore}
					aria-label="Load more search results"
				>
					{#if searchState.loadingMore}
						<Spinner size="sm" />
						Loading more...
					{:else}
						Load More Results
					{/if}
				</button>
			</div>
		{/if}
	{/if}

	<!-- Empty state -->
	{#if !searchState.searching && searchState.query && searchState.results.length === 0 && !searchState.error}
		<div class="flex flex-col items-center gap-2 py-8">
			<Text size="base" color="muted">No results found</Text>
			<Text size="sm" color="muted">Try a different search term</Text>
		</div>
	{/if}

	<!-- No search yet -->
	{#if !searchState.query && !searchState.searching}
		<div class="flex flex-col items-center gap-2 py-6">
			<Text size="sm" color="muted">Search HuggingFace to find and download GGUF models</Text>
		</div>
	{/if}
</div>

<style>
	.hf-result-card {
		transition: border-color 0.2s ease;
	}
	.gguf-row:hover {
		background: var(--surface-elevated);
	}
</style>
