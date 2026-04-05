<!--
  @file ResourceAllocationPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ResourceAllocationPanel

  Right 40% panel in ModelLoaderStep. Shows resource allocation tiers:
  GPU Reserved, GPU Shared, CPU/DDR, Disk. Per-slot tier assignment.
  Persists via set_preference.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, friendlySlotLabel } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";
import { wizardState } from "../wizard.runes.svelte.js";
import type { ResourceTier } from "../wizard.types.js";

const TIERS: { id: ResourceTier; label: string; description: string }[] = [
	{ id: "gpu_reserved", label: "GPU Reserved", description: "Never unloaded while app is active" },
	{ id: "gpu_shared", label: "GPU Shared", description: "Load/unload on signal or demand" },
	{ id: "cpu_ddr", label: "CPU / DDR", description: "Always available, no GPU" },
	{ id: "disk_cold", label: "Disk (Cold)", description: "Cold storage, slow reload" },
];

function getSlotTier(slotId: string): ResourceTier {
	const rule = wizardState.resourceRules.find((r) => r.slotId === slotId);
	if (rule) return rule.tier;
	const slot = modelsState.slots.find((s) => s.id === slotId);
	return slot?.preferred_device === "gpu" ? "gpu_reserved" : "cpu_ddr";
}

function setSlotTier(slotId: string, tier: ResourceTier): void {
	const existing = wizardState.resourceRules.findIndex((r) => r.slotId === slotId);
	const rule = {
		slotId,
		tier,
		priority: existing >= 0 ? wizardState.resourceRules[existing].priority : 10,
	};
	if (existing >= 0) {
		wizardState.resourceRules[existing] = rule;
	} else {
		wizardState.resourceRules = [...wizardState.resourceRules, rule];
	}
	persistRules();
}

async function persistRules(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("set_preference", {
			key: "resource_rules",
			value: JSON.stringify(wizardState.resourceRules),
		});
	} catch {
		// Non-critical — rules still in memory
	}
}

function slotsForTier(tier: ResourceTier): Array<{ id: string; label: string; vramMb: number }> {
	return modelsState.userSlots
		.filter((s) => getSlotTier(s.id) === tier)
		.map((s) => {
			const model = modelsState.assignedModel(s.id);
			return {
				id: s.id,
				label: friendlySlotLabel(s.id),
				vramMb: model?.vram_estimate_mb ?? 0,
			};
		});
}

const gpuReservedTotal = $derived(
	slotsForTier("gpu_reserved").reduce((sum, s) => sum + s.vramMb, 0),
);
</script>

<div class={`${stack({ gap: "4" })} overflow-y-auto`}>
	<!-- Clyffy tip -->
	<div
		class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg border")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<Text size="xs" color="secondary">
			{pickVariation("resource.allocation_tip")}
		</Text>
	</div>

	<!-- Tier sections -->
	{#each TIERS as tier (tier.id)}
		{@const slots = slotsForTier(tier.id)}
		<div class={stack({ gap: "2" })}>
			<Text size="xs" weight="bold" color="secondary">{tier.label}</Text>
			<Text size="xs" color="muted">{tier.description}</Text>

			{#if slots.length > 0}
				{#each slots as slot (slot.id)}
					<div class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}>
						<div
							class="flex items-center justify-between gap-2"
							style="border-color: var(--border-subtle); background: var(--surface-base);"
						>
							<Text size="xs" color="primary">{slot.label}</Text>
							{#if slot.vramMb > 0}
								<Text size="xs" color="muted">{formatMb(slot.vramMb)}</Text>
							{/if}
							<select
								class="rounded px-1 py-0.5 text-xs border"
								style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
								value={tier.id}
								onchange={(e) => setSlotTier(slot.id, e.currentTarget.value as ResourceTier)}
								aria-label="Resource tier for {slot.label}"
							>
								{#each TIERS as t (t.id)}
									<option value={t.id}>{t.label}</option>
								{/each}
							</select>
						</div>
					</div>
				{/each}
			{:else}
				<Text size="xs" color="muted">No slots in this tier</Text>
			{/if}
		</div>
	{/each}

	<!-- GPU reserved total -->
	{#if hardwareState.hasGpu}
		<div class="border-t pt-2" style="border-color: var(--border-subtle);">
			<Text size="xs" color="muted">
				GPU Reserved: {formatMb(gpuReservedTotal)} / {formatMb(hardwareState.vramTotalMb)}
			</Text>
		</div>
	{/if}

	<!-- VRAM tight warning -->
	{#if hardwareState.hasGpu && gpuReservedTotal > hardwareState.vramTotalMb * 0.8}
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
