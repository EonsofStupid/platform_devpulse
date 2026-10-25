<!--
  @file ModelLoaderStep.svelte
  Phase 2 orchestrator. Two-column: left=slot assignment, right=VRAM+resources.
  Scans models on mount. Mounts Toaster. Colocated CSS.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { Toaster } from "$lib/design/components/toaster/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { importLocalModel as importModel } from "../../../services/download.service.js";
import type { SlotId } from "../../../types/models.types.js";
import { formatMb } from "../../../types/models.types.js";
import ResourceAllocationPanel from "./ResourceAllocationPanel.svelte";
import SlotAssignmentPanel from "./SlotAssignmentPanel.svelte";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}
let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();

let scanned = $state(false);
$effect(() => {
	if (!scanned) {
		scanned = true;
		modelsState.scan().then(() => modelsState.refresh());
	}
});

async function handleImport(slotId: SlotId): Promise<void> {
	try {
		await importModel(slotId);
		await modelsState.scan();
		await modelsState.refresh();
	} catch (e) {
		console.error("[ModelLoaderStep] Import failed:", e);
	}
}
</script>

<Toaster position="bottom-right" />

<div class="loader-step">
	<h2 class="step-title">Set Up Your AI Models</h2>
	<p class="step-desc">
		Assign models to each capability. Models on your disk are auto-detected.
		{#if hardwareState.hasGpu}
			Your GPU ({hardwareState.gpuName}) has {formatMb(hardwareState.vramFreeMb)} VRAM free.
		{:else}
			No GPU detected — models will run on CPU.
		{/if}
	</p>

	<div class="two-col">
		<!-- Left: Slot assignment -->
		<div class="col-left">
			<SlotAssignmentPanel
				onBrowseModels={() => {}}
				onImport={handleImport}
			/>
		</div>

		<!-- Right: Resources -->
		<div class="col-right">
			<ResourceAllocationPanel />
		</div>
	</div>

	<!-- Navigation -->
	<div class="nav">
		<button class="btn-back" onclick={onBack}><ArrowLeft size={14} /> Back</button>
		<div class="nav-right">
			{#if !continueEnabled && continueBlockers.length > 0}
				<span class="blocker">{continueBlockers[0]}</span>
			{/if}
			<button class="btn-continue" onclick={onContinue} disabled={!continueEnabled}>
				Continue <ArrowRight size={14} />
			</button>
		</div>
	</div>
</div>

<style>
	.loader-step { display:flex;flex-direction:column;gap:1rem;width:100%;flex:1;min-height:0; }
	.step-title { font-size:1.25rem;font-weight:800;color:oklch(0.93 0.015 224);margin:0; }
	.step-desc { font-size:0.875rem;color:oklch(0.6 0.02 220);margin:0; }

	.two-col { display:grid;grid-template-columns:1fr 22rem;gap:1.5rem;flex:1;min-height:0; }
	.col-left { overflow-y:auto;min-height:0; }
	.col-right { display:flex;flex-direction:column;gap:1rem;overflow-y:auto; }

	.nav { display:flex;justify-content:space-between;align-items:center;gap:1rem;padding-top:0.5rem; }
	.nav-right { display:flex;align-items:center;gap:0.75rem; }
	.blocker { font-size:0.75rem;color:oklch(0.55 0.02 220); }

	.btn-back { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1rem;border-radius:0.5rem;border:none;background:transparent;color:oklch(0.6 0.02 220);font-size:0.875rem;cursor:pointer; }
	.btn-back:hover { color:oklch(0.8 0.02 220); }
	.btn-continue { display:inline-flex;align-items:center;gap:0.375rem;padding:0.5rem 1.5rem;border-radius:0.5rem;border:none;background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);font-size:0.875rem;font-weight:700;cursor:pointer; }
	.btn-continue:hover { filter:brightness(1.15); }
	.btn-continue:disabled { opacity:0.4;cursor:not-allowed; }
</style>
