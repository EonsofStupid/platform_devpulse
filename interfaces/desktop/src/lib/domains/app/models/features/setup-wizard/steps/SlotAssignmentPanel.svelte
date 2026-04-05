<!--
  @file SlotAssignmentPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/SlotAssignmentPanel

  Lists all user-visible slots. Each shows assigned model, status, device.
  Actions: download recommended, assign, load. Bulk: install all, import, browse.
-->
<script lang="ts">
import { Check, Download, FolderOpen, LoaderCircle, Search, Zap } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { ModelStatus } from "../../../types/models.types.js";
import {
	calculateFit,
	formatMb,
	friendlySlotLabel,
	statusLabel,
} from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { bulkDownloadAndAssign, downloadAndAssign } from "../wizard.service.js";
import type { ModelRec } from "../wizard.types.js";

interface Props {
	onBrowseModels: () => void;
	onImport: () => void;
}

let { onBrowseModels, onImport }: Props = $props();

function statusToVariant(status: ModelStatus): "positive" | "informative" | "negative" | "neutral" {
	switch (status.type) {
		case "hot":
		case "standby":
			return "positive";
		case "warm":
		case "loading":
			return "informative";
		case "failed":
			return "negative";
		case "cold":
		case "unloading":
			return "neutral";
	}
}

function fitToSignalVar(vramMb: number): string {
	const fit = calculateFit(vramMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb);
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

async function handleDownload(rec: ModelRec): Promise<void> {
	await downloadAndAssign(rec);
}

async function handleLoad(slotId: string): Promise<void> {
	await modelsState.load(slotId);
}

async function handleBulkInstall(): Promise<void> {
	await bulkDownloadAndAssign(wizardState.recommendations);
}
</script>

<div class={`${stack({ gap: "4" })} overflow-y-auto flex-1`}>
	<!-- Slot rows -->
	{#each modelsState.userSlots as slot (slot.id)}
		{@const model = modelsState.assignedModel(slot.id)}
		{@const status = modelsState.statuses[slot.id] ?? { type: "cold" as const }}
		{@const rec = wizardState.recommendations.find((r) => r.slot === slot.id)}
		<div
			class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md w-full border")}
			style="background: var(--surface-base); border-color: var(--border-subtle);"
		>
			<div class={stack({ gap: "3" })}>
				<!-- Slot header -->
				<div class={hstack({ gap: "8", align: "center" })}>
					<Text size="sm" weight="bold" color="primary" class="flex-1">
						{friendlySlotLabel(slot.id)}
					</Text>
					<Badge variant={statusToVariant(status)} size="sm">
						{statusLabel(status)}
					</Badge>
				</div>

				<!-- Model info -->
				{#if model}
					<div class={hstack({ gap: "4", align: "center" })}>
						<Text size="xs" color="muted" class="flex-1 truncate">{model.filename}</Text>
						{#if model.vram_estimate_mb}
							<Text size="xs" color="muted">{formatMb(model.vram_estimate_mb)}</Text>
						{/if}
					</div>
				{:else if rec}
					<!-- Recommendation available but not downloaded -->
					<div class={hstack({ gap: "4", align: "center" })}>
						<Text size="xs" color="muted" class="flex-1">{rec.name}</Text>
						<Text size="xs" style="color: {fitToSignalVar(rec.vramMb)};">
							{formatMb(rec.sizeMb)}
						</Text>
					</div>
				{:else}
					<Text size="xs" color="muted">No model assigned</Text>
				{/if}

				<!-- Actions -->
				<div class={hstack({ gap: "3", align: "center" })}>
					{#if rec && !model}
						<button
							class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => handleDownload(rec)}
							aria-label="Download {rec.name}"
						>
							<Download size={12} />
							Get
						</button>
					{/if}
					{#if model && status.type === "cold"}
						<button
							class="flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
							style="background: var(--accent-teal-main); color: var(--surface-base);"
							onclick={() => handleLoad(slot.id)}
							aria-label="Load model in {friendlySlotLabel(slot.id)}"
						>
							<Zap size={12} />
							Load
						</button>
					{/if}
					{#if status.type === "loading"}
						<LoaderCircle size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
					{/if}
				</div>
			</div>
		</div>
	{/each}

	{#if modelsState.userSlots.length === 0}
		<Text size="sm" color="muted">No slots available. Platform may still be starting...</Text>
	{/if}

	<!-- Error display -->
	{#if wizardState.error}
		<div
			class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md w-full")}
			style="background: var(--signal-error); color: var(--text-primary);"
		>
			<Text size="xs" color="primary">{wizardState.error}</Text>
		</div>
	{/if}

	<!-- Bulk actions -->
	<div class={hstack({ gap: "3", align: "center", justify: "center" })}>
		<button
			class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-colors"
			style="background: var(--accent-teal-main); color: var(--surface-base);"
			onclick={handleBulkInstall}
			aria-label="Install all suggested models"
		>
			<Zap size={14} />
			Install All Suggested
		</button>

		<button
			class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors border"
			style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
			onclick={onImport}
			aria-label="Import model from disk"
		>
			<FolderOpen size={14} />
			Import
		</button>

		<button
			class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs transition-colors border"
			style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
			onclick={onBrowseModels}
			aria-label="Browse model catalog"
		>
			<Search size={14} />
			Browse Models
		</button>
	</div>
</div>
