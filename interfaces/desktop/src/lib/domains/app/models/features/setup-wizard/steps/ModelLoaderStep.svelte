<!--
  @file ModelLoaderStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ModelLoaderStep

  Phase 2 orchestrator. Two-column layout: left slots, right VRAM + resources.
  Toaster mounted. Scan on entry. No popup overlays.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { Toaster } from "$lib/design/components/toaster/index.js";
import VramGauge from "../../../components/VramGauge.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { importLocalModel } from "../../../services/download.service.js";
import type { SlotId } from "../../../types/models.types.js";
import ResourceAllocationPanel from "./ResourceAllocationPanel.svelte";
import SlotAssignmentPanel from "./SlotAssignmentPanel.svelte";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}

let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();

// Scan models on Phase 2 entry — discover everything on disk
let scanned = $state(false);
$effect(() => {
	if (!scanned) {
		scanned = true;
		modelsState.scan().then(() => modelsState.refresh());
	}
});

async function handleImport(slotId: SlotId): Promise<void> {
	try {
		await importLocalModel(slotId);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		console.error("[ModelLoaderStep] Import failed:", e);
	}
}
</script>

<Toaster position="bottom-right" />

<div class="flex flex-col gap-6 w-full flex-1 min-h-0">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<Text size="lg" weight="bold" color="primary">Model Loader</Text>
	</div>

	<!-- Two-column layout -->
	<div class="grid grid-cols-[1fr_22rem] gap-6 flex-1 min-h-0">
		<!-- Left: Slot Assignment (scrollable) -->
		<div class="overflow-y-auto min-h-0">
			<SlotAssignmentPanel
				onBrowseModels={() => { /* HF search inline in ML-05 */ }}
				onImport={handleImport}
			/>
		</div>

		<!-- Right: VRAM + Resources (sticky) -->
		<div class="flex flex-col gap-4 overflow-y-auto">
			<VramGauge
				usedMb={hardwareState.vramUsedMb}
				totalMb={hardwareState.vramTotalMb}
				hasGpu={hardwareState.hasGpu}
				gpuError={hardwareState.gpuError}
				label={hardwareState.gpuName}
				size={140}
			/>
			<ResourceAllocationPanel />
		</div>
	</div>

	<!-- Navigation -->
	<div class="flex items-center justify-between">
		<button
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
			style="color: var(--text-muted);"
			onclick={onBack}
			aria-label="Back to hardware detection"
		>
			<ArrowLeft size={14} />
			Back
		</button>

		<div class="flex flex-col items-end gap-2">
			{#if !continueEnabled && continueBlockers.length > 0}
				<Text size="sm" style="color: var(--signal-warning);">{continueBlockers[0]}</Text>
			{/if}
			<button
				class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={onContinue}
				disabled={!continueEnabled}
				aria-label="Continue to voice pipeline"
			>
				Continue
				<ArrowRight size={14} />
			</button>
		</div>
	</div>
</div>
