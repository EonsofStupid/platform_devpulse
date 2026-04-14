<!--
  @file VoiceLabPanel — Main panel with 4 tabs.
  @domain voice
-->
<script lang="ts">
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import type { VoiceLabTab } from "../../util/voice.contract.js";
import SttSetup from "./SttSetup.svelte";
import TestBench from "./TestBench.svelte";
import TtsSetup from "./TtsSetup.svelte";
import VoiceProfiles from "./VoiceProfiles.svelte";

const m = $derived(renderForge({ kind: "card", preset: "neuro-elevated" }));

const tabs: { id: VoiceLabTab; label: string }[] = [
	{ id: "tts", label: "TTS Setup" },
	{ id: "stt", label: "STT Setup" },
	{ id: "profiles", label: "Profiles" },
	{ id: "test", label: "Test Bench" },
];
</script>

<div
	class="flex flex-col h-full"
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
>
	<!-- Tab bar -->
	<nav class="flex border-b border-[var(--border-subtle)] px-4">
		{#each tabs as tab}
			<button
				class="px-4 py-2 text-sm font-medium transition-colors
					{voiceState.activeTab === tab.id
						? 'text-[var(--accent-teal-main)] border-b-2 border-[var(--accent-teal-main)]'
						: 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}"
				onclick={() => voiceState.setTab(tab.id)}
			>
				{tab.label}
			</button>
		{/each}
	</nav>

	<!-- Tab content -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if voiceState.activeTab === "tts"}
			<TtsSetup />
		{:else if voiceState.activeTab === "stt"}
			<SttSetup />
		{:else if voiceState.activeTab === "profiles"}
			<VoiceProfiles />
		{:else if voiceState.activeTab === "test"}
			<TestBench />
		{/if}
	</div>
</div>
