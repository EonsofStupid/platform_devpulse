<!--
  @file ModelLoaderStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ModelLoaderStep

  Phase 2 orchestrator. Two-column layout (60/40).
  Left: SlotAssignmentPanel. Right: placeholder for ResourceAllocationPanel (Sprint 4).
  VRAM budget bar at top. Continue gate: chat.brain must be LOADED.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import VramGauge from "../../../components/VramGauge.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { SlotId } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { downloadAndAssign } from "../wizard.service.js";
import type { ModelRec } from "../wizard.types.js";
import ImportPrompt from "./ImportPrompt.svelte";
import ModelBrowserPopup from "./ModelBrowserPopup.svelte";
import ResourceAllocationPanel from "./ResourceAllocationPanel.svelte";
import SlotAssignmentPanel from "./SlotAssignmentPanel.svelte";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}

let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();

async function handleBrowserDownload(
	repoId: string,
	filename: string,
	targetSlot: string,
): Promise<void> {
	const rec: ModelRec = wizardState.recommendations.find(
		(r) => r.repo === repoId && r.file === filename,
	) ?? {
		name: filename,
		purpose: "",
		slot: targetSlot as SlotId,
		sizeMb: 0,
		vramMb: 0,
		repo: repoId,
		file: filename,
		device: "any" as const,
	};
	await downloadAndAssign(rec);
	wizardState.showModelBrowser = false;
}

function handleBrowserImport(targetSlot: string): void {
	wizardState.importTargetSlot = targetSlot as SlotId;
	wizardState.showImportPrompt = true;
	wizardState.showModelBrowser = false;
}

async function handleImportComplete(_filename: string): Promise<void> {
	wizardState.showImportPrompt = false;
	await modelsState.scan();
	await modelsState.refresh();
}
</script>

{#if wizardState.showModelBrowser}
	<ModelBrowserPopup
		onClose={() => (wizardState.showModelBrowser = false)}
		onDownload={handleBrowserDownload}
		onImport={handleBrowserImport}
	/>
{/if}

{#if wizardState.showImportPrompt && wizardState.importTargetSlot}
	<ImportPrompt
		targetSlot={wizardState.importTargetSlot}
		onClose={() => (wizardState.showImportPrompt = false)}
		onComplete={handleImportComplete}
	/>
{/if}

<div class={`${stack({ gap: "6" })} w-full flex-1`}>
	<!-- VRAM Budget Bar -->
	<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
		<Text size="lg" weight="bold" color="primary">Model Loader</Text>
		<VramGauge
			usedMb={hardwareState.vramUsedMb}
			totalMb={hardwareState.vramTotalMb}
			hasGpu={hardwareState.hasGpu}
			gpuError={hardwareState.gpuError}
			label={hardwareState.gpuName}
			size={100}
		/>
	</div>

	<!-- Two-column layout -->
	<div class="grid grid-cols-[3fr_2fr] gap-6 flex-1 min-h-0">
		<!-- Left: Slot Assignment (60%) -->
		<SlotAssignmentPanel
			onBrowseModels={() => (wizardState.showModelBrowser = true)}
			onImport={() => { wizardState.importTargetSlot = "chat.brain" as SlotId; wizardState.showImportPrompt = true; }}
		/>

		<!-- Right: Resource Allocation (40%) -->
		<ResourceAllocationPanel />
	</div>

	<!-- Navigation -->
	<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
		<button
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
			style="color: var(--text-muted);"
			onclick={onBack}
			aria-label="Back to hardware detection"
		>
			<ArrowLeft size={14} />
			Back
		</button>

		<div class={stack({ gap: "2", align: "end" })}>
			{#if !continueEnabled && continueBlockers.length > 0}
				<Text size="xs" color="muted">{continueBlockers[0]}</Text>
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
