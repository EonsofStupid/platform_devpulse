<!--
  @file VoicePipelineStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/VoicePipelineStep

  Phase 3 orchestrator. Tabbed layout with 6 panels:
  STT, TTS, Voice Brain, Escalation, Latency, Pipeline Test.
  Continue gate: voice.stt + voice.tts + voice.brain must have models assigned.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import ConversationalBrainPanel from "./ConversationalBrainPanel.svelte";
import EscalationConfigPanel from "./EscalationConfigPanel.svelte";
import FullPipelineTest from "./FullPipelineTest.svelte";
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

const tabs = [
	{ id: "stt", label: "STT" },
	{ id: "tts", label: "TTS" },
	{ id: "brain", label: "Voice Brain" },
	{ id: "escalation", label: "Escalation" },
	{ id: "latency", label: "Latency" },
	{ id: "test", label: "Pipeline Test" },
] as const;

type TabId = (typeof tabs)[number]["id"];
let activeTab = $state<TabId>("stt");
</script>

<div class={`${stack({ gap: "6" })} w-full flex-1`}>
	<Text size="lg" weight="bold" color="primary">Voice Pipeline</Text>

	<!-- Tab bar -->
	<div class={hstack({ gap: "1", align: "center" })} role="tablist">
		{#each tabs as tab (tab.id)}
			<button
				role="tab"
				aria-selected={activeTab === tab.id}
				class={cn(
					"rounded-lg px-3 py-1.5 text-xs font-bold transition-colors border",
					activeTab === tab.id ? "" : "opacity-60",
				)}
				style="background: {activeTab === tab.id ? 'var(--surface-elevated)' : 'transparent'}; color: var(--text-primary); border-color: {activeTab === tab.id ? 'var(--border-subtle)' : 'transparent'};"
				onclick={() => {
					activeTab = tab.id;
				}}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	<div class="flex-1 min-h-0 overflow-y-auto">
		{#if activeTab === "stt"}
			<SttConfigPanel />
		{:else if activeTab === "tts"}
			<TtsConfigPanel />
		{:else if activeTab === "brain"}
			<ConversationalBrainPanel />
		{:else if activeTab === "escalation"}
			<EscalationConfigPanel />
		{:else if activeTab === "latency"}
			<LatencyTuningPanel />
		{:else if activeTab === "test"}
			<FullPipelineTest />
		{/if}
	</div>

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
