<!--
  @file ResourceAllocationPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ResourceAllocationPanel

  Right 40% panel in ModelLoaderStep. READ-ONLY display of current
  allocation derived from AllocationMode and slot preferred_device.
  No arbiter exists yet — no editable tier selectors.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, friendlySlotLabel } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";
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
</script>

<div class={`${stack({ gap: "4" })} overflow-y-auto`}>
	<!-- Allocation mode badge -->
	<div class={hstack({ gap: "3", align: "center" })}>
		<Text size="xs" weight="bold" color="secondary">Allocation Mode</Text>
		<Text size="xs" color="primary">{allocationLabel(wizardState.allocationMode)}</Text>
	</div>

	<!-- Clyffy tip -->
	<div
		class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg border")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<Text size="xs" color="secondary">
			{pickVariation("resource.allocation_tip")}
		</Text>
	</div>

	<!-- GPU slots -->
	{#if gpuSlots.length > 0}
		<div class={stack({ gap: "2" })}>
			<Text size="xs" weight="bold" color="secondary">GPU (reserved while active)</Text>
			{#each gpuSlots as slot (slot.id)}
				{@const model = modelsState.assignedModel(slot.id)}
				<div class={hstack({ gap: "3", align: "center" })}>
					<Text size="xs" color="primary" class="flex-1">{friendlySlotLabel(slot.id)}</Text>
					{#if model?.vram_estimate_mb}
						<Text size="xs" color="muted">{formatMb(model.vram_estimate_mb)}</Text>
					{/if}
				</div>
			{/each}
			{#if hardwareState.hasGpu}
				<Text size="xs" color="muted">
					Est. GPU: {formatMb(gpuUsedEstimate)} / {formatMb(hardwareState.vramTotalMb)}
				</Text>
			{/if}
		</div>
	{/if}

	<!-- CPU slots -->
	{#if cpuSlots.length > 0}
		<div class={stack({ gap: "2" })}>
			<Text size="xs" weight="bold" color="secondary">CPU / DDR (always available)</Text>
			{#each cpuSlots as slot (slot.id)}
				<div class={hstack({ gap: "3", align: "center" })}>
					<Text size="xs" color="primary" class="flex-1">{friendlySlotLabel(slot.id)}</Text>
					<Text size="xs" color="muted">CPU</Text>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Timing estimates -->
	<div class={stack({ gap: "1" })}>
		<Text size="xs" weight="bold" color="secondary">Load Times</Text>
		<Text size="xs" color="muted">GPU reserved: instant (always in VRAM)</Text>
		<Text size="xs" color="muted">CPU burst: ~1-3s (from DDR)</Text>
		<Text size="xs" color="muted">Cold storage: 3-30s (from disk)</Text>
	</div>

	<!-- VRAM tight warning -->
	{#if hardwareState.hasGpu && gpuUsedEstimate > hardwareState.vramTotalMb * 0.8}
		<div
			class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded")}
			style="background: var(--signal-warning); color: var(--text-primary);"
		>
			<Text size="xs" color="primary">
				{pickVariation("resource.vram_tight")}
			</Text>
		</div>
	{/if}
</div>
