<!--
  @file ModelPicker — Dropdown to select a local model for a slot.
  Shows all compatible models discovered on disk with metadata.
  VRAM fit indicator, file size, quant level, architecture.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Check, ChevronDown, HardDrive, Info } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatContext,
	formatMb,
} from "../../util/models.types.js";
import ModelDetailPanel from "./ModelDetailPanel.svelte";

// ── Props ─────────────────────────────────────────────────────

interface Props {
	models: ModelInfo[];
	selectedModelId: string | null;
	committedModelId: string | null;
	pendingModelId: string | null;
	onSelect: (modelId: string) => void;
}

let { models, selectedModelId, committedModelId, pendingModelId, onSelect }: Props = $props();

// ── State ─────────────────────────────────────────────────────

let open = $state(false);
let detailModel = $state<ModelInfo | null>(null);

// ── Derived ───────────────────────────────────────────────────

const selectedModel = $derived(models.find((model) => model.id === selectedModelId) ?? null);

// ── Actions ───────────────────────────────────────────────────

function handleSelect(modelId: string): void {
	onSelect(modelId);
	open = false;
}

function fitIndicator(model: ModelInfo): { color: string; label: string } {
	const fit = calculateFit(
		model.vram_estimate_mb,
		hardwareState.vramFreeMb,
		hardwareState.vramTotalMb,
	);
	return { color: fitColor(fit), label: fitLabel(fit) };
}

/** Friendly quant label for layman mode. */
function quantLabel(quant: string | null): string {
	if (!quant) return "";
	if (quant.includes("Q4_K_M") || quant.includes("Q4_K_S")) return "Balanced";
	if (quant.includes("Q8") || quant.includes("F16")) return "High Quality";
	if (quant.includes("Q2") || quant.includes("Q3")) return "Fast";
	if (quant.includes("Q5") || quant.includes("Q6")) return "Quality";
	return quant;
}
</script>

<div class="relative" data-component="model-picker">
	<!-- Trigger button -->
	<button
		class="flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:brightness-110"
		style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
		onclick={() => { open = !open; }}
		title={models.length === 0
			? "No compatible models found on disk - download or import one first"
			: `${models.length} compatible model${models.length === 1 ? "" : "s"} found on your PC`}
	>
		<div class={hstack({ gap: "2", align: "center" })}>
			<HardDrive size={14} style="color: var(--text-muted);" />
			{#if selectedModel}
				<span>{selectedModel.filename}</span>
				<span class="text-xs opacity-50">({formatMb(selectedModel.size_mb)})</span>
			{:else}
				<span style="color: var(--text-muted);">Choose a model from your PC</span>
			{/if}
		</div>
		<ChevronDown
			size={14}
			style="color: var(--text-muted); transition: transform 0.15s; {open ? 'transform: rotate(180deg);' : ''}"
		/>
	</button>

	<!-- Dropdown -->
	{#if open}
		<!-- Backdrop -->
		<button
			class="fixed inset-0 z-40"
			style="background: transparent;"
			onclick={() => { open = false; }}
			aria-label="Close model picker"
		></button>

		<div
			class="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border shadow-lg"
			style="background: var(--surface-base); border-color: var(--border-subtle);"
		>
			{#if models.length === 0}
				<div class="px-4 py-6 text-center">
					<Text size="sm" color="muted">No compatible models on disk</Text>
					<Text size="xs" color="muted">Download or import a model first</Text>
				</div>
			{:else}
				{#each models as model (model.id)}
					{@const fit = fitIndicator(model)}
					{@const isSelected = selectedModelId === model.id}
					{@const isCommitted = committedModelId === model.id}
					{@const isPending = pendingModelId === model.id}
					<div
						class="flex w-full items-center gap-3 border-b px-3 py-2.5 transition-colors hover:brightness-110 cursor-pointer"
						style="border-color: var(--border-subtle); {isSelected ? 'background: oklch(0.2 0.03 185 / 0.3);' : ''}"
						role="option"
						aria-selected={isSelected}
						tabindex="0"
						onclick={() => handleSelect(model.id)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(model.id); } }}
					>
						<!-- Fit indicator dot -->
						<div
							class="h-2.5 w-2.5 shrink-0 rounded-full"
							style="background: {fit.color};"
							title={fit.label}
						></div>

						<!-- Model info -->
						<div class={`${stack({ gap: "0" })} min-w-0 flex-1`}>
							<div class={hstack({ gap: "2", align: "center" })}>
								<span class="truncate text-sm font-medium" style="color: var(--text-primary);">
									{model.filename}
								</span>
								{#if isSelected}
									<Check size={12} style="color: var(--signal-success);" />
								{/if}
							</div>
							<div class="flex gap-2 text-xs" style="color: var(--text-muted);">
								{#if isPending}
									<span>Pending</span>
								{:else if isCommitted}
									<span>Committed</span>
								{/if}
								<span>{model.architecture}</span>
								{#if model.quant_level}
									<span>· {quantLabel(model.quant_level)}</span>
								{/if}
								<span>· {formatMb(model.size_mb)}</span>
								{#if model.context_length > 0}
									<span>· {formatContext(model.context_length)}</span>
								{/if}
							</div>
						</div>

						<!-- VRAM estimate + info button -->
						<div class="flex shrink-0 items-center gap-2">
							<div class="text-right">
								<div class="text-xs font-medium" style="color: {fit.color};">
									~{formatMb(model.vram_estimate_mb)}
								</div>
								<div class="text-[10px]" style="color: var(--text-muted);">GPU</div>
							</div>
							<button
								class="rounded p-1 transition-colors hover:brightness-125"
								style="color: var(--text-muted);"
								onclick={(e) => { e.stopPropagation(); detailModel = detailModel?.id === model.id ? null : model; }}
								title="View full model details"
								aria-label="Show details for {model.filename}"
							>
								<Info size={12} />
							</button>
						</div>
					</div>
					{#if detailModel?.id === model.id}
						<div class="border-b px-1 py-1" style="border-color: var(--border-subtle);">
							<ModelDetailPanel
								model={detailModel}
								showPath={true}
								onDelete={() => { detailModel = null; open = false; }}
							/>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	{/if}

</div>
