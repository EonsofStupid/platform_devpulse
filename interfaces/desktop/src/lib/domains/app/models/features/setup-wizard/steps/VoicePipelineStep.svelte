<!--
  @file VoicePipelineStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/VoicePipelineStep

  Phase 3 orchestrator. Three sections: STT config, TTS config, Latency Tuning.
  Continue gate: voice.stt + voice.tts must have models assigned.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import LatencyTuningPanel from "./LatencyTuningPanel.svelte";
import SttConfigPanel from "./SttConfigPanel.svelte";
import TtsConfigPanel from "./TtsConfigPanel.svelte";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}

let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();
</script>

<div class={`${stack({ gap: "6" })} w-full flex-1`}>
	<Text size="lg" weight="bold" color="primary">Voice Pipeline</Text>

	<SttConfigPanel />
	<TtsConfigPanel />
	<LatencyTuningPanel />

	<!-- Navigation -->
	<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
		<button
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
			style="color: var(--text-muted);"
			onclick={onBack}
			aria-label="Back to model loader"
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
				aria-label="Continue to Clyffy activation"
			>
				Continue
				<ArrowRight size={14} />
			</button>
		</div>
	</div>
</div>
