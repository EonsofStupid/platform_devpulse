<!--
  @file ModelPicker — Dropdown to select a local model for a slot.
  Shows all compatible models discovered on disk with metadata.
  VRAM fit indicator, file size, quant level, architecture.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Check, ChevronDown, HardDrive, Info, X } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type { ModelInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../data-access/models.state.svelte.js";
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
	/** Slot ID this picker assigns to. */
	slotId: string;
	/** Required capability for filtering. */
	capability: string;
	/** Called after a model is assigned. */
	onAssign?: (model: ModelInfo) => void;
}

let { slotId, capability, onAssign }: Props = $props();

// ── State ─────────────────────────────────────────────────────

let open = $state(false);
let assigning = $state(false);
let detailModel = $state<ModelInfo | null>(null);
let error = $state<string | null>(null);

// ── Derived ───────────────────────────────────────────────────

const compatibleModels = $derived(modelsState.modelsForCapability(capability));
const currentSlot = $derived(modelsState.slots.find((s) => s.id === slotId));
const assignedModel = $derived(modelsState.assignedModel(slotId));

// ── Actions ───────────────────────────────────────────────────

async function handleSelect(model: ModelInfo): Promise<void> {
	if (assigning) return;
	assigning = true;
	error = null;
	try {
		await modelsState.assign(slotId, model.id);
		open = false;
		onAssign?.(model);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	} finally {
		assigning = false;
	}
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
		title={compatibleModels.length === 0
			? "No compatible models found on disk — download or import one first"
			: `${compatibleModels.length} compatible model${compatibleModels.length === 1 ? "" : "s"} found on your PC`}
	>
		<div class={hstack({ gap: "2", align: "center" })}>
			<HardDrive size={14} style="color: var(--text-muted);" />
			{#if assignedModel}
				<span>{assignedModel.filename}</span>
				<span class="text-xs opacity-50">({formatMb(assignedModel.size_mb)})</span>
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
			{#if compatibleModels.length === 0}
				<div class="px-4 py-6 text-center">
					<Text size="sm" color="muted">No compatible models on disk</Text>
					<Text size="xs" color="muted">Download or import a model first</Text>
				</div>
			{:else}
				{#each compatibleModels as model (model.id)}
					{@const fit = fitIndicator(model)}
					{@const isAssigned = assignedModel?.id === model.id}
					<div
						class="flex w-full items-center gap-3 border-b px-3 py-2.5 transition-colors hover:brightness-110 cursor-pointer"
						style="border-color: var(--border-subtle); {isAssigned ? 'background: oklch(0.2 0.03 185 / 0.3);' : ''}"
						role="option"
						aria-selected={isAssigned}
						tabindex="0"
						onclick={() => handleSelect(model)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(model); } }}
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
								{#if isAssigned}
									<Check size={12} style="color: var(--signal-success);" />
								{/if}
							</div>
							<div class="flex gap-2 text-xs" style="color: var(--text-muted);">
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

	<!-- Error -->
	{#if error}
		<div class={`${hstack({ gap: "1", align: "center" })} mt-1`}>
			<X size={12} style="color: var(--signal-error);" />
			<Text size="xs" color="negative">{error}</Text>
		</div>
	{/if}
</div>
