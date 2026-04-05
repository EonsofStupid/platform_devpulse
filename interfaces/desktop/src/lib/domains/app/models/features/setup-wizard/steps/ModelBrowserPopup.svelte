<!--
  @file ModelBrowserPopup.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ModelBrowserPopup

  Full popup overlay within wizard viewport. Three sections:
  1. Curated recommendations (from wizardState.recommendations)
  2. HuggingFace search (via searchState rune)
  3. Local/Symlink import options
-->
<script lang="ts">
import { Download, FolderOpen, Link, Search, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { searchState } from "../../../runes/search.runes.svelte.js";
import type { FitIndicator } from "../../../types/models.types.js";
import { calculateFit, formatBytes, formatMb } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";
import { wizardState } from "../wizard.runes.svelte.js";

interface Props {
	onClose: () => void;
	onDownload: (repoId: string, filename: string, targetSlot: string) => void;
	onImport: (targetSlot: string) => void;
}

let { onClose, onDownload, onImport }: Props = $props();

let searchQuery = $state("");

function handleSearchInput(value: string): void {
	searchQuery = value;
	searchState.setQuery(value);
}

function fitToSignalVar(fit: FitIndicator): string {
	switch (fit) {
		case "green":
			return "var(--signal-success)";
		case "yellow":
			return "var(--signal-warning)";
		case "red":
			return "var(--signal-error)";
		case "gray":
			return "var(--text-muted)";
	}
}

function fitToLabel(fit: FitIndicator): string {
	switch (fit) {
		case "green":
			return "Fits GPU";
		case "yellow":
			return "Tight";
		case "red":
			return "Won't fit";
		case "gray":
			return "CPU";
	}
}

function quantTooltip(quantLevel: string | null): string {
	if (!quantLevel) return "";
	const lower = quantLevel.toLowerCase();
	if (lower.includes("q4_k_m")) return pickVariation("quant.q4_k_m");
	if (lower.includes("q6_k")) return pickVariation("quant.q6_k");
	if (lower.includes("q8")) return pickVariation("quant.q8_0");
	return "";
}

/** Estimate VRAM from file size (rough: file size * 1.1 for overhead). */
function estimateVramFromBytes(sizeBytes: number): number {
	return Math.round((sizeBytes / (1024 * 1024)) * 1.1);
}
</script>

<!-- Overlay -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center"
	style="background: var(--overlay-backdrop);"
	role="dialog"
	aria-label="Model browser"
>
	<div
		class={cn(stack({ gap: "4" }), "w-full max-w-4xl max-h-[90vh] rounded-xl p-6 border overflow-y-auto")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<!-- Header -->
		<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
			<Text size="lg" weight="bold" color="primary">Model Browser</Text>
			<button
				class="rounded p-1 transition-colors"
				style="color: var(--text-muted);"
				onclick={onClose}
				aria-label="Close model browser"
			>
				<X size={18} />
			</button>
		</div>

		<!-- Search bar -->
		<div class={hstack({ gap: "3", align: "center" })}>
			<Search size={14} style="color: var(--text-muted);" />
			<input
				type="text"
				placeholder="Search HuggingFace for GGUF models..."
				value={searchQuery}
				oninput={(e) => handleSearchInput(e.currentTarget.value)}
				class="flex-1 rounded-lg px-3 py-2 text-sm border"
				style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
			/>
		</div>

		<!-- Section 1: Curated Recommendations -->
		{#if wizardState.recommendations.length > 0 && !searchQuery}
			<div class={stack({ gap: "3" })}>
				<Text size="sm" weight="bold" color="secondary">
					Recommended for {wizardState.allocationMode}
				</Text>
				{#each wizardState.recommendations as rec (rec.slot + rec.file)}
					{@const fit = calculateFit(rec.vramMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
					<div
						class={cn(box({ paddingX: "12", paddingY: "6" }), "rounded-md border")}
						style="background: var(--surface-base); border-color: var(--border-subtle);"
					>
						<div class={hstack({ gap: "8", align: "center" })}>
							<div class="flex-1">
								<Text size="sm" weight="bold" color="primary">{rec.name}</Text>
								<Text size="xs" color="muted">{rec.purpose}</Text>
							</div>
							<Text size="xs" color="muted">{formatMb(rec.sizeMb)}</Text>
							<Badge
								variant={fit === "green" ? "positive" : fit === "yellow" ? "notice" : fit === "red" ? "negative" : "neutral"}
								size="sm"
							>
								{fitToLabel(fit)}
							</Badge>
							<button
								class="flex items-center gap-1 rounded px-2 py-1 text-xs"
								style="background: var(--accent-teal-main); color: var(--surface-base);"
								onclick={() => onDownload(rec.repo, rec.file, rec.slot)}
								aria-label="Download {rec.name}"
							>
								<Download size={12} />
								Get
							</button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Section 2: HuggingFace Search Results -->
		{#if searchQuery}
			<div class={stack({ gap: "3" })}>
				<Text size="sm" weight="bold" color="secondary">
					{searchState.searching ? "Searching..." : `HuggingFace Results (${searchState.results.length})`}
				</Text>

				{#if searchState.error}
					<Text size="xs" color="accent">{searchState.error}</Text>
				{/if}

				{#each searchState.results as result (result.repo_id)}
					<div
						class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md border")}
						style="background: var(--surface-base); border-color: var(--border-subtle);"
					>
						<div class={stack({ gap: "3" })}>
							<div class={hstack({ gap: "4", align: "center" })}>
								<Text size="sm" weight="bold" color="primary" class="flex-1">
									{result.model_name}
								</Text>
								<Text size="xs" color="muted">{result.author}</Text>
							</div>

							<!-- GGUF files -->
							{#each result.gguf_files as file (file.filename)}
								{@const vramEst = estimateVramFromBytes(file.size_bytes)}
								{@const fit = calculateFit(vramEst, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
								<div class={hstack({ gap: "4", align: "center" })}>
									<Text size="xs" color="muted" class="flex-1 truncate">
										{file.filename}
									</Text>
									{#if file.quant_level}
										<Badge
											variant="neutral"
											size="sm"
											title={quantTooltip(file.quant_level)}
										>
											{file.quant_level}
										</Badge>
									{/if}
									<Text size="xs" color="muted">{formatBytes(file.size_bytes)}</Text>
									<Text size="xs" style="color: {fitToSignalVar(fit)};">
										{fitToLabel(fit)}
									</Text>
									<button
										class="flex items-center gap-1 rounded px-2 py-1 text-xs"
										style="background: var(--accent-teal-main); color: var(--surface-base);"
										onclick={() => onDownload(result.repo_id, file.filename, "chat.brain")}
										aria-label="Download {file.filename}"
									>
										<Download size={12} />
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				{#if !searchState.searching && searchState.results.length === 0 && searchQuery.length > 2}
					<Text size="xs" color="muted">No GGUF models found for "{searchQuery}"</Text>
				{/if}
			</div>
		{/if}

		<!-- Section 3: Local / Symlink -->
		<div class={stack({ gap: "3" })}>
			<Text size="sm" weight="bold" color="secondary">Local / Import</Text>
			<div class={hstack({ gap: "3" })}>
				<button
					class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors border"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
					onclick={() => onImport("chat.brain")}
					aria-label="Import model from disk"
				>
					<FolderOpen size={14} />
					Import from path...
				</button>
				<button
					class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors border"
					style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
					onclick={() => onImport("chat.brain")}
					aria-label="Create symlink to model"
				>
					<Link size={14} />
					Create Symlink...
				</button>
			</div>
		</div>
	</div>
</div>
