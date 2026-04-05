<!--
  @file SlotRow — Single model slot with assignment, status, and preset-driven fit colors.
  Uses renderForge for ALL styling. No raw oklch. No raw px in styles.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import type { SemanticIntent } from "$lib/design/visual/preset-id.js";
import { hardwareState } from "../runes/hardware.runes.svelte.js";
import { modelsState } from "../runes/models.runes.svelte.js";
import type { FitIndicator, ModelStatus, SlotInfo } from "../types/models.types.js";
import { formatMb, friendlySlotLabel, statusLabel } from "../types/models.types.js";

interface Props {
	slot: SlotInfo;
	layman?: boolean;
}

let { slot, layman = true }: Props = $props();

const assigned = $derived(modelsState.assignedModel(slot.id));
const status = $derived(modelsState.statuses[slot.id] ?? ({ type: "cold" } as ModelStatus));
const compatibleModels = $derived(modelsState.modelsForCapability(slot.capability));

const fit: FitIndicator = $derived.by(() => {
	if (!assigned) return "gray";
	return hardwareState.fitForModel(assigned.vram_estimate_mb);
});

const fitIntent: SemanticIntent = $derived.by(() => {
	switch (fit) {
		case "green":
			return "success";
		case "yellow":
			return "warning";
		case "red":
			return "danger";
		case "gray":
			return "neutral";
	}
});

const m = $derived(renderForge({ kind: "slot-row", preset: fitIntent }));
const mPicker = $derived(renderForge({ kind: "slot-picker", preset: "neutral" }));

const isLoaded = $derived(status.type === "hot");
const isLoading = $derived(status.type === "loading");
const canLoad = $derived(assigned !== null && !isLoaded && !isLoading);

let showPicker = $state(false);

async function handleLoad() {
	try {
		await modelsState.load(slot.id);
	} catch (e) {
		console.error(`[SlotRow] Load FAILED for ${slot.id}:`, e);
	}
}

async function handleUnload() {
	try {
		await modelsState.unload(slot.id);
	} catch (e) {
		console.error(`[SlotRow] Unload FAILED for ${slot.id}:`, e);
	}
}

async function handleAssign(modelId: string) {
	if (isLoaded) {
		// Slot is loaded — use atomic swap (unload → reassign → load)
		try {
			await modelsState.swap(slot.id, modelId);
		} catch (e) {
			console.error(`[SlotRow] Swap FAILED for ${slot.id}:`, e);
		}
	} else {
		await modelsState.assign(slot.id, modelId);
	}
	showPicker = false;
}
</script>

<div
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class="relative flex items-center gap-3 rounded-lg border-l-4 px-3 py-2 transition-colors"
>
	<!-- Fit indicator dot -->
	<div
		class="h-2.5 w-2.5 shrink-0 rounded-full"
		style="background: var(--color); box-shadow: var(--box-shadow);"
		title={fit === "green" ? "Fits easily" : fit === "yellow" ? "Tight fit" : fit === "red" ? "Won't fit in VRAM" : "No GPU"}
	></div>

	<!-- Slot label + model info -->
	<div class={stack({ gap: "1" })} style="flex: 1; min-width: 0;">
		<div class={hstack({ justify: "between", align: "center" })}>
			<Text size="sm" weight="medium" color="primary">
				{layman ? friendlySlotLabel(slot.id) : slot.id}
			</Text>
			<Badge variant={isLoaded ? "positive" : status.type === "failed" ? "negative" : "neutral"} size="sm">
				{statusLabel(status)}
			</Badge>
		</div>

		<div class={hstack({ gap: "2", align: "center" })}>
			{#if assigned}
				<button
					class="cursor-pointer truncate text-left text-xs transition-colors hover:underline"
					style="color: var(--color);"
					onclick={() => (showPicker = !showPicker)}
				>
					{assigned.filename}
				</button>
				{#if !layman}
					<span class="text-xs opacity-60">
						{formatMb(assigned.vram_estimate_mb)} VRAM
					</span>
				{/if}
			{:else}
				<button
					class="cursor-pointer text-xs italic opacity-50 transition-colors hover:underline"
					onclick={() => (showPicker = !showPicker)}
				>
					Click to assign a model
				</button>
			{/if}

			{#if slot.fallback}
				<span class="text-xs opacity-60" title="Falls back to {slot.fallback}">
					→ {layman ? friendlySlotLabel(slot.fallback) : slot.fallback}
				</span>
			{/if}
		</div>

		{#if isLoading && status.type === "loading"}
			<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full opacity-30">
				<div
					class="h-full rounded-full transition-all duration-300"
					style="width: {status.progressPct}%; background: var(--color);"
				></div>
			</div>
			<Text size="xs" color="muted">{status.stage.replace("_", " ")} — {Math.round(status.progressPct)}%</Text>
		{/if}
	</div>

	<!-- Load/Unload button -->
	<div class="flex shrink-0 gap-1">
		{#if isLoaded}
			<button
				class="rounded px-2 py-1 text-xs font-medium opacity-70 transition-colors hover:opacity-100"
				onclick={handleUnload}
			>
				Unload
			</button>
		{:else if canLoad}
			{@const loadM = renderForge({ kind: "slot-load-btn", preset: "accent" })}
			<button
				{...loadM.dataAttrs}
				style={cssVarString(loadM.cssVars)}
				class="rounded px-2 py-1 text-xs font-medium transition-colors"
				onclick={handleLoad}
			>
				Load
			</button>
		{/if}
	</div>
</div>

<!-- Model picker dropdown -->
{#if showPicker}
	<div
		{...mPicker.dataAttrs}
		style={cssVarString(mPicker.cssVars)}
		class="mt-1 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border p-2"
	>
		{#if compatibleModels.length === 0}
			<Text size="xs" color="muted">No compatible models found. Download one first.</Text>
		{:else}
			{#each compatibleModels as model (model.id)}
				{@const modelFit = hardwareState.fitForModel(model.vram_estimate_mb)}
				{@const modelIntent = modelFit === "green" ? "success" : modelFit === "yellow" ? "warning" : modelFit === "red" ? "danger" : "neutral"}
				{@const modelM = renderForge({ kind: "model-pick-row", preset: modelIntent })}
				<button
					{...modelM.dataAttrs}
					style={cssVarString(modelM.cssVars)}
					class="flex items-center gap-2 rounded px-2 py-1.5 text-left transition-colors hover:brightness-110"
					onclick={() => handleAssign(model.id)}
				>
					<div
						class="h-2 w-2 shrink-0 rounded-full"
						style="background: var(--color);"
					></div>
					<div class="flex-1 truncate">
						<div class="truncate text-xs font-medium" style="color: var(--color, var(--color));">
							{model.filename}
						</div>
						<div class="text-xs opacity-50">
							{model.architecture} · {model.quant_level ?? "?"} · {formatMb(model.vram_estimate_mb)} VRAM
						</div>
					</div>
					<Badge
						variant={modelFit === "green" ? "positive" : modelFit === "yellow" ? "positive" : "negative"}
						size="sm"
					>
						{modelFit === "green" ? "Easy" : modelFit === "yellow" ? "Tight" : modelFit === "red" ? "Too Big" : "CPU"}
					</Badge>
				</button>
			{/each}
		{/if}
	</div>
{/if}
