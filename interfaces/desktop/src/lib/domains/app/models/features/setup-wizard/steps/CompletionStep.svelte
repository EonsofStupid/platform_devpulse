<!--
  @file CompletionStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/CompletionStep

  Final summary. All configured models with status. VRAM/DDR summary.
  "Enter DevPulse" button calls markOnboardingComplete then onComplete.
-->
<script lang="ts">
import { Check, TriangleAlert, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { formatMb, friendlySlotLabel, statusLabel } from "../../../types/models.types.js";
import { markOnboardingComplete } from "../wizard.service.js";

interface Props {
	onComplete: () => void;
}

let { onComplete }: Props = $props();

let launching = $state(false);

async function handleEnter(): Promise<void> {
	launching = true;
	await markOnboardingComplete();
	onComplete();
}
</script>

<div class={`${stack({ gap: "6", align: "center" })} w-full max-w-2xl flex-1 justify-center`}>
	<!-- Clyffy message -->
	<div
		class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<Text size="sm" color="secondary">
			Setup complete. Here's what we've got:
		</Text>
	</div>

	<!-- Slot summary -->
	<div class={`${stack({ gap: "3" })} w-full`}>
		{#each modelsState.userSlots as slot (slot.id)}
			{@const model = modelsState.assignedModel(slot.id)}
			{@const status = modelsState.statuses[slot.id] ?? { type: "not_loaded" as const }}
			<div class={hstack({ gap: "3", align: "center" })}>
				{#if model}
					<Check size={14} style="color: var(--signal-success);" />
				{:else}
					<TriangleAlert size={14} style="color: var(--signal-warning);" />
				{/if}
				<Text size="sm" color="primary" class="flex-1">
					{friendlySlotLabel(slot.id)}
				</Text>
				{#if model}
					<Text size="xs" color="muted">{model.filename}</Text>
				{:else}
					<Text size="xs" color="muted">Not assigned</Text>
				{/if}
				<Badge
					variant={status.type === "loaded" ? "positive" : status.type === "failed" ? "negative" : "neutral"}
					size="sm"
				>
					{statusLabel(status)}
				</Badge>
			</div>
		{/each}
	</div>

	<!-- Resource summary -->
	<div class={hstack({ gap: "8", align: "center" })}>
		<Text size="xs" color="muted">
			VRAM: {formatMb(hardwareState.vramUsedMb)} / {formatMb(hardwareState.vramTotalMb)}
		</Text>
		{#if hardwareState.metrics?.ram_total_mb}
			<Text size="xs" color="muted">
				RAM: {formatMb(hardwareState.metrics.ram_used_mb)} / {formatMb(hardwareState.metrics.ram_total_mb)}
			</Text>
		{/if}
	</div>

	<!-- Completion message -->
	<Text size="sm" color="muted">
		Everything you configured is saved — next launch skips straight to the app.
	</Text>

	<!-- Enter button -->
	<button
		class="flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-bold transition-all disabled:opacity-40"
		style="background: var(--accent-teal-main); color: var(--surface-base); box-shadow: var(--glow-teal);"
		onclick={handleEnter}
		disabled={launching}
		aria-label="Enter DevPulse"
	>
		<Zap size={18} />
		{launching ? "Launching..." : "Enter DevPulse"}
	</button>
</div>
