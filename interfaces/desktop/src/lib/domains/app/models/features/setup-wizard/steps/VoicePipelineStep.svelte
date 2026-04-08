<!--
  @file VoicePipelineStep.svelte
  Voice pipeline orchestrator. Tabs: STT, TTS, Voice Brain, Escalation, API Keys, Latency, Pipeline Test.
  STT and TTS are prominent first-class tools with visible descriptions.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Cloud, Key, Mic, Settings2, Volume2, Zap } from "lucide-svelte";
import ApiKeyPanel from "./ApiKeyPanel.svelte";
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

const tabs: Array<{
	id: TabId;
	label: string;
	desc: string;
	icon: typeof Mic;
	prominent?: boolean;
}> = [
	{ id: "stt", label: "Ears (STT)", desc: "How Clyffy hears you", icon: Mic, prominent: true },
	{ id: "tts", label: "Voice (TTS)", desc: "How Clyffy speaks", icon: Volume2, prominent: true },
	{ id: "brain", label: "Voice Brain", desc: "Quick response model", icon: Zap },
	{ id: "escalation", label: "Escalation", desc: "Fallback chain", icon: Settings2 },
	{ id: "apikeys", label: "API Keys", desc: "Cloud AI providers", icon: Key },
	{ id: "latency", label: "Latency", desc: "Speed tuning", icon: Settings2 },
	{ id: "test", label: "Pipeline Test", desc: "End-to-end test", icon: Cloud },
];
type TabId = "stt" | "tts" | "brain" | "escalation" | "apikeys" | "latency" | "test";
let activeTab = $state<TabId>("stt");
</script>

<div class="voice-step">
	<h2 class="step-title">Voice &amp; AI Pipeline</h2>
	<p class="step-desc">Configure how Clyffy hears, speaks, thinks, and connects to cloud AI. Each tool below handles one piece.</p>

	<!-- Tab bar with prominent STT/TTS -->
	<div class="tab-bar" role="tablist">
		{#each tabs as tab (tab.id)}
			{@const Icon = tab.icon}
			<button
				role="tab"
				aria-selected={activeTab === tab.id}
				class="tab" class:active={activeTab === tab.id} class:prominent={tab.prominent}
				onclick={() => { activeTab = tab.id; }}
			>
				<Icon size={16} />
				<div class="tab-text">
					<span class="tab-label">{tab.label}</span>
					<span class="tab-desc">{tab.desc}</span>
				</div>
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	<div class="tab-content">
		{#if activeTab === "stt"}
			<SttConfigPanel />
		{:else if activeTab === "tts"}
			<TtsConfigPanel />
		{:else if activeTab === "brain"}
			<ConversationalBrainPanel />
		{:else if activeTab === "escalation"}
			<EscalationConfigPanel />
		{:else if activeTab === "apikeys"}
			<ApiKeyPanel />
		{:else if activeTab === "latency"}
			<LatencyTuningPanel />
		{:else if activeTab === "test"}
			<FullPipelineTest />
		{/if}
	</div>

	<!-- Navigation -->
	<div class="nav">
		<button class="btn-back" onclick={onBack} aria-label="Go back"><ArrowLeft size={14} /> Back</button>
		<div class="nav-right">
			{#if !continueEnabled && continueBlockers.length > 0}
				<span class="blocker">{continueBlockers[0]}</span>
			{/if}
			<button class="btn-continue" onclick={onContinue} disabled={!continueEnabled}
				aria-label="Continue to next step">
				Continue <ArrowRight size={14} />
			</button>
		</div>
	</div>
</div>

<style>
	.voice-step { display:flex;flex-direction:column;gap:1rem;width:100%;flex:1; }
	.step-title { font-size:1.25rem;font-weight:800;color:oklch(0.93 0.015 224);margin:0; }
	.step-desc { font-size:0.875rem;color:oklch(0.6 0.02 220);margin:0; }

	/* Tab bar */
	.tab-bar { display:flex;gap:0.25rem;overflow-x:auto;padding-bottom:0.25rem; }
	.tab {
		display:flex;align-items:center;gap:0.5rem;
		padding:0.5rem 0.875rem;border-radius:0.5rem;border:1px solid transparent;
		background:transparent;color:oklch(0.55 0.02 220);font-size:0.8125rem;
		cursor:pointer;white-space:nowrap;transition:all 100ms;
	}
	.tab:hover { background:oklch(0.15 0.02 220/0.4); }
	.tab.active {
		background:oklch(0.15 0.025 220/0.6);border-color:oklch(0.3 0.03 220/0.4);
		color:oklch(0.93 0.015 224);
	}
	/* Prominent tabs (STT/TTS) get teal accent when active */
	.tab.prominent.active {
		border-color:oklch(0.65 0.17 185/0.5);
		background:oklch(0.12 0.04 185/0.2);
		color:oklch(0.65 0.17 185);
	}
	.tab.prominent { font-weight:700; }

	.tab-text { display:flex;flex-direction:column; }
	.tab-label { display:block;font-size:0.8125rem;font-weight:inherit; }
	.tab-desc { display:block;font-size:0.625rem;color:oklch(0.45 0.02 220);line-height:1.2; }
	.tab.active .tab-desc { color:oklch(0.6 0.02 220); }

	.tab-content { flex:1;min-height:0;overflow-y:auto; }

	/* Nav */
	.nav { display:flex;justify-content:space-between;align-items:center;gap:1rem;padding-top:0.5rem; }
	.nav-right { display:flex;align-items:center;gap:0.75rem; }
	.blocker { font-size:0.875rem;color:oklch(0.55 0.02 220); }
	.btn-back {
		display:inline-flex;align-items:center;gap:0.375rem;
		padding:0.5rem 1rem;border-radius:0.5rem;border:none;
		background:transparent;color:oklch(0.6 0.02 220);font-size:0.875rem;cursor:pointer;
	}
	.btn-back:hover { color:oklch(0.8 0.02 220); }
	.btn-continue {
		display:inline-flex;align-items:center;gap:0.375rem;
		padding:0.5rem 1.5rem;border-radius:0.5rem;border:none;
		background:oklch(0.65 0.17 185);color:oklch(0.12 0.02 220);
		font-size:0.875rem;font-weight:700;cursor:pointer;transition:filter 100ms;
	}
	.btn-continue:hover { filter:brightness(1.15); }
	.btn-continue:disabled { opacity:0.4;cursor:not-allowed; }
</style>
