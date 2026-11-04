<!--
  @file ModelBrowserPopup.svelte
  @module @devpulse/domains/app/models/feature/setup-wizard/steps/ModelBrowserPopup

  Full popup overlay within wizard viewport. Three sections:
  1. Curated recommendations (from wizardState.recommendations)
  2. HuggingFace search (via searchState rune)
  3. Local/Symlink import options
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Text } from "@devpulse/coldlight/components/text";
import { box, cn, hstack, stack } from "@devpulse/coldlight/utils";
import { Download, FolderOpen, Link, Search, X } from "lucide-svelte";
import { copyState, fill } from "#lib/sys/copy/index.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { searchState } from "../../../data-access/search.state.svelte.js";
import type { FitIndicator, SlotId } from "../../../util/models.types.js";
import {
	calculateFit,
	formatBytes,
	formatMb,
	friendlySlotLabel,
} from "../../../util/models.types.js";
import { pickVariation } from "../seed-families.js";
import { wizardState } from "../wizard.state.svelte.js";
import type { ModelBrowserFilter } from "../wizard.types.js";

interface Props {
	targetSlot: SlotId;
	onClose: () => void;
	onDownload: (repoId: string, filename: string, targetSlot: string) => void;
	onImport: (targetSlot: string, mode: "copy" | "symlink") => void;
}

let { targetSlot, onClose, onDownload, onImport }: Props = $props();

const text = $derived(copyState.catalog?.setup_wizard.model_browser ?? null);

let selectedSlot = $state<SlotId>("chat.brain");
let searchQuery = $state("");

$effect(() => {
	selectedSlot = targetSlot;
});
let filter = $state<ModelBrowserFilter>({ format: "gguf", maxSizeMb: null, fitOnly: false });

const filteredResults = $derived(
	searchState.results.filter((r) => {
		if (filter.format === "gguf" && r.gguf_files.length === 0) return false;
		if (filter.fitOnly) {
			return r.gguf_files.some(
				(f) =>
					calculateFit(
						estimateVramFromBytes(f.size_bytes),
						hardwareState.vramFreeMb,
						hardwareState.vramTotalMb,
					) === "green",
			);
		}
		return true;
	}),
);

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
			return text?.fit_green ?? "";
		case "yellow":
			return text?.fit_yellow ?? "";
		case "red":
			return text?.fit_red ?? "";
		case "gray":
			return text?.fit_gray ?? "";
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

{#if text}

<!-- Overlay -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center browser-scrim"
	role="dialog"
	aria-label={text.title}
>
	<div
		class={cn(stack({ gap: "4" }), "w-full max-w-4xl max-h-[90vh] p-6 overflow-y-auto browser-panel")}
	>
		<!-- Header -->
		<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
			<Text size="lg" weight="bold" color="primary">{text.title}</Text>
			<Button variant="ghost" size="sm" onclick={onClose} aria-label={text.close}>
				<X size={18} />
			</Button>
		</div>

		<!-- Search bar -->
		<div class={hstack({ gap: "3", align: "center" })}>
			<Search size={14} />
			<input
				type="text"
				placeholder={text.search_placeholder}
				value={searchQuery}
				oninput={(e) => handleSearchInput(e.currentTarget.value)}
				class="flex-1 px-3 py-2 browser-field"
			/>
		</div>

		<!-- Target slot selector + format filter -->
		<div class={hstack({ gap: "4", align: "center" })}>
			<div class={hstack({ gap: "2", align: "center" })}>
				<Text size="xs" weight="bold" color="secondary">{text.slot_label}</Text>
				<select
					class="px-3 py-1.5 browser-field"
					value={selectedSlot}
					onchange={(e) => { selectedSlot = e.currentTarget.value as SlotId; }}
				>
					{#each modelsState.userSlots as slot (slot.id)}
						<option value={slot.id}>{friendlySlotLabel(slot.id)}</option>
					{/each}
				</select>
			</div>
			<div class={hstack({ gap: "2", align: "center" })}>
				<Text size="xs" weight="bold" color="secondary">{text.format_label}</Text>
				<select
					class="px-3 py-1.5 browser-field"
					value={filter.format}
					onchange={(e) => { filter = { ...filter, format: e.currentTarget.value as ModelBrowserFilter["format"] }; }}
				>
					<option value="gguf">{text.format_gguf}</option>
					<option value="safetensors" disabled>{text.format_safetensors}</option>
					<option value="all">{text.format_all}</option>
				</select>
			</div>
			<label class="flex items-center gap-1.5 cursor-pointer">
				<input
					type="checkbox"
					checked={filter.fitOnly}
					onchange={(e) => { filter = { ...filter, fitOnly: e.currentTarget.checked }; }}
				/>
				<Text size="xs" color="muted">{text.fits_only}</Text>
			</label>
		</div>

		<!-- Section 1: Curated Recommendations -->
		{#if wizardState.recommendations.length > 0 && !searchQuery}
			<div class={stack({ gap: "3" })}>
				<Text size="sm" weight="bold" color="secondary">
					{fill(text.recommended_for, { mode: wizardState.allocationMode })}
				</Text>
				{#each wizardState.recommendations as rec (rec.slot + rec.file)}
					{@const fit = calculateFit(rec.vramMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
					<div
						class={cn(box({ paddingX: "12", paddingY: "6" }), "browser-row")}
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
							<Button
								variant="primary"
								size="sm"
								onclick={() => onDownload(rec.repo, rec.file, rec.slot)}
								aria-label={fill(text.download_aria, { name: rec.name })}
							>
								<Download size={12} />
								{text.get}
							</Button>
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Section 2: HuggingFace Search Results -->
		{#if searchQuery}
			<div class={stack({ gap: "3" })}>
				<Text size="sm" weight="bold" color="secondary">
					{searchState.searching ? text.searching : fill(text.results, { count: filteredResults.length })}
				</Text>

				{#if searchState.error}
					<Text size="xs" color="accent">{searchState.error}</Text>
				{/if}

				{#each filteredResults as result (result.repo_id)}
					<div
						class={cn(box({ paddingX: "12", paddingY: "8" }), "browser-row")}
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
									<Button
										variant="primary"
										size="sm"
										onclick={() => onDownload(result.repo_id, file.filename, selectedSlot)}
										aria-label={fill(text.download_aria, { name: file.filename })}
									>
										<Download size={12} />
									</Button>
								</div>
							{/each}
						</div>
					</div>
				{/each}

				{#if !searchState.searching && filteredResults.length === 0 && searchQuery.length > 2}
					<Text size="xs" color="muted">{fill(text.no_results, { query: searchQuery })}</Text>
				{/if}
			</div>
		{/if}

		<!-- Section 3: Local / Symlink -->
		<div class={stack({ gap: "3" })}>
			<Text size="sm" weight="bold" color="secondary">{text.local_heading}</Text>
			<div class={hstack({ gap: "3" })}>
				<Button variant="secondary" size="sm" onclick={() => onImport(selectedSlot, "copy")} aria-label={text.import_aria}>
					<FolderOpen size={14} />
					{text.import_path}
				</Button>
				<Button variant="secondary" size="sm" onclick={() => onImport(selectedSlot, "symlink")} aria-label={text.symlink_aria}>
					<Link size={14} />
					{text.symlink}
				</Button>
			</div>
		</div>
	</div>
</div>
{/if}

<style>
	.browser-scrim {
		background: var(--overlay-scrim);
	}
	:global(.browser-panel) {
		border-radius: var(--radius-lg);
		background: var(--surface-raised);
		border: var(--border-width-thin) solid var(--border-subtle);
	}
	:global(.browser-row),
	.browser-field {
		border-radius: var(--radius-md);
		background: var(--surface-base);
		border: var(--border-width-thin) solid var(--border-subtle);
		color: var(--text-primary);
		font-size: 0.875rem;
	}
</style>
