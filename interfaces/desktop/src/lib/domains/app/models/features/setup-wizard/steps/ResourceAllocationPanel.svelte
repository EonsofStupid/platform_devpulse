<!--
  @file ResourceAllocationPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ResourceAllocationPanel

  Right panel in ModelLoaderStep. VRAM stacked bar, per-slot breakdown,
  allocation mode, load time estimates.
-->
<script lang="ts">
import { Badge } from "$lib/design/components/badge/index.js";
import { Separator } from "$lib/design/components/separator/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, friendlySlotLabel, isInferenceReady } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { allocationLabel } from "../wizard.types.js";

const gpuSlots = $derived(
	modelsState.userSlots.filter(
		(s) => s.preferred_device === "Gpu" || s.preferred_device === "GpuWithCpuFallback",
	),
);

const cpuSlots = $derived(modelsState.userSlots.filter((s) => s.preferred_device === "Cpu"));

const gpuUsedEstimate = $derived(
	gpuSlots.reduce((sum, s) => {
		const model = modelsState.assignedModel(s.id);
		return sum + (model?.vram_estimate_mb ?? 0);
	}, 0),
);

const isOverBudget = $derived(hardwareState.hasGpu && gpuUsedEstimate > hardwareState.vramTotalMb);

const overBudgetMb = $derived(isOverBudget ? gpuUsedEstimate - hardwareState.vramTotalMb : 0);
</script>

<div class="flex flex-col gap-4">
	<!-- Allocation mode -->
	<div class="flex items-center gap-3">
		<Text size="sm" weight="bold" color="secondary">Mode</Text>
		<Badge variant="informative" size="sm">{allocationLabel(wizardState.allocationMode)}</Badge>
	</div>

	<!-- VRAM stacked bar -->
	{#if hardwareState.hasGpu}
		<div>
			<Text size="sm" weight="bold" color="secondary" class="mb-2">GPU Memory</Text>
			<div class="vram-bar flex h-6 rounded-lg overflow-hidden border" style="border-color: var(--border-subtle);">
				{#each gpuSlots as slot (slot.id)}
					{@const model = modelsState.assignedModel(slot.id)}
					{@const vram = model?.vram_estimate_mb ?? 0}
					{@const pct = hardwareState.vramTotalMb > 0 ? (vram / hardwareState.vramTotalMb) * 100 : 0}
					{@const loaded = isInferenceReady(modelsState.statuses[slot.id] ?? { type: "cold" })}
					{#if vram > 0}
						<div
							class="transition-all"
							style="width: {pct}%; background: {loaded ? 'var(--accent-teal-main)' : 'var(--text-muted)'};"
							title="{friendlySlotLabel(slot.id)}: {formatMb(vram)}"
						></div>
					{/if}
				{/each}
				<div class="flex-1" style="background: var(--surface-base);"></div>
			</div>
			<div class="flex justify-between mt-1">
				<Text size="sm" color="muted">
					{formatMb(gpuUsedEstimate)} planned / {formatMb(hardwareState.vramTotalMb)} total
				</Text>
				<Text size="sm" color="muted">{formatMb(hardwareState.vramTotalMb - gpuUsedEstimate)} free</Text>
			</div>
			{#if isOverBudget}
				<Text size="sm" style="color: var(--signal-error);" class="mt-1">
					Over budget by {formatMb(overBudgetMb)} — some models will fall back to CPU
				</Text>
			{/if}
		</div>
	{:else}
		<Text size="sm" color="muted">No GPU — all models run on CPU</Text>
	{/if}

	<Separator />

	<!-- GPU slots -->
	{#if gpuSlots.length > 0}
		<div class="flex flex-col gap-2">
			<Text size="sm" weight="bold" color="secondary">GPU Slots</Text>
			{#each gpuSlots as slot (slot.id)}
				{@const model = modelsState.assignedModel(slot.id)}
				{@const loaded = isInferenceReady(modelsState.statuses[slot.id] ?? { type: "cold" })}
				<div class="flex items-center gap-3">
					<div
						class="w-2 h-2 rounded-full"
						style="background: {loaded ? 'var(--signal-success)' : model ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
					></div>
					<Text size="sm" color="primary" class="flex-1">{friendlySlotLabel(slot.id)}</Text>
					{#if model?.vram_estimate_mb}
						<Text size="sm" color="muted">{formatMb(model.vram_estimate_mb)}</Text>
					{:else}
						<Text size="sm" color="muted">—</Text>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<!-- CPU slots -->
	{#if cpuSlots.length > 0}
		<div class="flex flex-col gap-2">
			<Text size="sm" weight="bold" color="secondary">CPU Slots</Text>
			{#each cpuSlots as slot (slot.id)}
				{@const model = modelsState.assignedModel(slot.id)}
				{@const loaded = isInferenceReady(modelsState.statuses[slot.id] ?? { type: "cold" })}
				<div class="flex items-center gap-3">
					<div
						class="w-2 h-2 rounded-full"
						style="background: {loaded ? 'var(--signal-success)' : model ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
					></div>
					<Text size="sm" color="primary" class="flex-1">{friendlySlotLabel(slot.id)}</Text>
					<Text size="sm" color="muted">CPU</Text>
				</div>
			{/each}
		</div>
	{/if}

	<Separator />

	<!-- Load time estimates -->
	<div class="flex flex-col gap-1">
		<Text size="sm" weight="bold" color="secondary">Estimated Load Times</Text>
		{#each modelsState.userSlots as slot (slot.id)}
			{@const model = modelsState.assignedModel(slot.id)}
			{@const isGpu = slot.preferred_device === "Gpu" || slot.preferred_device === "GpuWithCpuFallback"}
			{#if model}
				<Text size="sm" color="muted">
					{friendlySlotLabel(slot.id)}: {isGpu
						? (model.vram_estimate_mb ?? 0) > 4000 ? "~5-15s (large GPU model)" : "~2-5s (GPU)"
						: (model.vram_estimate_mb ?? 0) > 1000 ? "~3-10s (CPU, large)" : "~1-3s (CPU)"}
				</Text>
			{/if}
		{/each}
		{#if modelsState.userSlots.every((s) => !modelsState.assignedModel(s.id))}
			<Text size="sm" color="muted">Assign models to see load time estimates.</Text>
		{/if}
	</div>
</div>
