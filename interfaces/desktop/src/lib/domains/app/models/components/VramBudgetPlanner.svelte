<!--
  @file VramBudgetPlanner — Stacked bar showing per-slot VRAM allocation.
  Calls get_vram_budget on mount. Color per BudgetStatus.
  ALL styling via ColdLight semantic token vars.
-->
<script lang="ts">
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import {
	fetchVramBudget,
	type SlotBudgetEntryInfo,
	type VramBudgetInfo,
} from "../services/hardware.service.js";
import { formatMb, friendlySlotLabel } from "../types/models.types.js";

let budget = $state<VramBudgetInfo | null>(null);
let error = $state<string | null>(null);

$effect(() => {
	fetchVramBudget()
		.then((data) => {
			budget = data;
		})
		.catch((e) => {
			error = e instanceof Error ? e.message : String(e);
		});
});

const statusColors: Record<string, string> = {
	loaded: "oklch(0.7 0.15 155)",
	planned: "oklch(0.6 0.15 250)",
	wont_fit: "oklch(0.65 0.2 25)",
	unassigned: "oklch(0.35 0 0)",
	shared: "oklch(0.6 0.12 300)",
};

const statusLabels: Record<string, string> = {
	loaded: "Active",
	planned: "Will load",
	wont_fit: "Won't fit",
	unassigned: "No model",
	shared: "Shared",
};
</script>

<div
	class="rounded-xl border p-4"
	style="border-color: var(--border-subtle); background: var(--surface-base);"
	title="Shows how your graphics card memory is divided between AI models — red segments won't fit"
>
	<div class={stack({ gap: "3" })}>
		<Text size="sm" weight="bold" color="primary">VRAM Budget</Text>

		{#if error}
			<Text size="xs" color="negative">{error}</Text>
		{:else if budget}
			<!-- Stacked bar -->
			<div class="h-6 w-full overflow-hidden rounded-full" style="background: oklch(0.2 0 0);">
				<div class="flex h-full">
					{#each budget.per_slot.filter((s: SlotBudgetEntryInfo) => s.vram_estimate_mb > 0 && budget) as slot (slot.slot_id)}
						{@const widthPct = budget.total_vram_mb > 0 ? (slot.vram_estimate_mb / budget.total_vram_mb) * 100 : 0}
						<div
							class="h-full transition-all duration-300"
							style="width: {widthPct}%; background: {statusColors[slot.status] ?? 'oklch(0.35 0 0)'};"
							title="{friendlySlotLabel(slot.slot_id)}: {formatMb(slot.vram_estimate_mb)} ({statusLabels[slot.status] ?? slot.status})"
						></div>
					{/each}
				</div>
			</div>

			<!-- Legend -->
			<div class="flex flex-wrap gap-3">
				{#each budget.per_slot as slot (slot.slot_id)}
					<div class={hstack({ gap: "1", align: "center" })}>
						<div
							class="h-2.5 w-2.5 rounded-full"
							style="background: {statusColors[slot.status] ?? 'oklch(0.35 0 0)'};"
						></div>
						<Text size="xs" color="muted">
							{friendlySlotLabel(slot.slot_id)}
							{#if slot.vram_estimate_mb > 0}
								({formatMb(slot.vram_estimate_mb)})
							{/if}
						</Text>
					</div>
				{/each}
			</div>

			<!-- Summary -->
			<div class={hstack({ justify: "between", align: "center" })}>
				<Text size="xs" color="muted">
					{formatMb(budget.currently_used_mb)} used of {formatMb(budget.total_vram_mb)}
				</Text>
				{#if budget.fits}
					<Text size="xs" color="positive">All models fit</Text>
				{:else}
					<Text size="xs" color="negative">
						{formatMb(Math.abs(budget.remaining_after_plan_mb))} over budget
					</Text>
				{/if}
			</div>
		{:else}
			<Text size="xs" color="muted">Loading budget...</Text>
		{/if}
	</div>
</div>
