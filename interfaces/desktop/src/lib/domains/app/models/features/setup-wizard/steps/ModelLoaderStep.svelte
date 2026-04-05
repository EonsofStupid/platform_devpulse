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
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import VramGauge from "../../../components/VramGauge.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { pickVariation } from "../seed-families.js";
import SlotAssignmentPanel from "./SlotAssignmentPanel.svelte";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}

let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();
</script>

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
			onBrowseModels={() => {}}
			onImport={() => {}}
		/>

		<!-- Right: Placeholder for ResourceAllocationPanel (Sprint 4) -->
		<div class={`${stack({ gap: "4" })} overflow-y-auto`}>
			<Text size="sm" color="muted">
				{pickVariation("resource.allocation_tip")}
			</Text>
		</div>
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
