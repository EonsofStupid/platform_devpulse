<!--
  @file ModelLoaderStep.svelte
  Phase 2 orchestrator. Two-column: left=slot assignment, right=VRAM+resources.
  Scans models on mount. Mounts Toaster. Colocated CSS.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { copyState, fill } from "#lib/sys/copy/index.js";
import { logError } from "#lib/sys/logger.js";
import { importLocalModel as importModel } from "../../../data-access/download.service.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import { formatMb } from "../../../util/models.types.js";
import { downloadAndAssignFile, fetchRecommendations } from "../wizard.service.js";
import ModelBrowserPopup from "./ModelBrowserPopup.svelte";
import ResourceAllocationPanel from "./ResourceAllocationPanel.svelte";
import SlotAssignmentPanel from "./SlotAssignmentPanel.svelte";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
	/** Where a slot's Configure button leads (the voice settings). */
	onConfigure?: (slotId: SlotId) => void;
}
let { onContinue, onBack, continueEnabled, continueBlockers, onConfigure }: Props = $props();

const text = $derived(copyState.catalog?.setup_wizard.loader_step ?? null);

let browserSlot = $state<SlotId | null>(null);
let scanned = $state(false);
$effect(() => {
	if (!scanned) {
		scanned = true;
		// Reads only: what is on disk, and the plan for this machine.
		void modelsState.scan().then(() => modelsState.refresh());
		void fetchRecommendations();
	}
});

async function handleImport(slotId: SlotId, mode: "copy" | "symlink" = "copy"): Promise<void> {
	try {
		await importModel(slotId, mode);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		logError("wizard.loaderStep", `Import failed: ${String(e)}`);
	}
}
</script>

{#if text}

<div class="loader-step">
	<h2 class="step-title">{text.title}</h2>
	<p class="step-desc">
		{text.intro}
		{#if hardwareState.hasGpu}
			{fill(text.gpu_free, { gpu: hardwareState.gpuName ?? "", size: formatMb(hardwareState.vramFreeMb) })}
		{:else}
			{text.no_gpu}
		{/if}
	</p>

	<div class="two-col">
		<!-- Left: Slot assignment -->
		<div class="col-left">
			<SlotAssignmentPanel
				onBrowseModels={(slotId) => (browserSlot = slotId)}
				onImport={handleImport}
				{onConfigure}
			/>
		</div>

		<!-- Right: Resources -->
		<div class="col-right">
			<ResourceAllocationPanel />
		</div>
	</div>

	<!-- Navigation -->
	<div class="nav">
		<Button variant="ghost" size="md" onclick={onBack}><ArrowLeft size={14} /> {text.back}</Button>
		<div class="nav-right">
			{#if !continueEnabled && continueBlockers.length > 0}
				<span class="blocker">{continueBlockers[0]}</span>
			{/if}
			<Button variant="primary" size="md" onclick={onContinue} disabled={!continueEnabled}>
				{text.continue} <ArrowRight size={14} />
			</Button>
		</div>
	</div>
</div>

{#if browserSlot}
	<ModelBrowserPopup
		targetSlot={browserSlot}
		onClose={() => (browserSlot = null)}
		onDownload={(repoId, filename, slot) => {
			browserSlot = null;
			void downloadAndAssignFile(repoId, filename, slot as SlotId);
		}}
		onImport={(slot, mode) => {
			browserSlot = null;
			void handleImport(slot as SlotId, mode);
		}}
	/>
{/if}
{/if}

<style>
	.loader-step { display:flex;flex-direction:column;gap:1rem;width:100%;flex:1;min-height:0; }
	.step-title { font-size:1.25rem;font-weight:800;color:var(--text-primary);margin:0; }
	.step-desc { font-size:0.875rem;color:var(--text-muted);margin:0; }

	.two-col { display:grid;grid-template-columns:1fr 22rem;gap:1.5rem;flex:1;min-height:0; }
	.col-left { overflow-y:auto;min-height:0; }
	.col-right { display:flex;flex-direction:column;gap:1rem;overflow-y:auto; }

	.nav { display:flex;justify-content:space-between;align-items:center;gap:1rem;padding-top:0.5rem; }
	.nav-right { display:flex;align-items:center;gap:0.75rem; }
	.blocker { font-size:0.75rem;color:var(--text-muted); }

</style>
