<!--
  @file VoiceLabPanel — Main panel with 4 tabs.
  @domain voice
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@devpulse/coldlight/components/tabs";
import { copyState } from "#lib/sys/copy/index.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import type { VoiceLabTab } from "../../util/voice.contract.js";
import SttSetup from "./SttSetup.svelte";
import TestBench from "./TestBench.svelte";
import TtsSetup from "./TtsSetup.svelte";
import VoiceProfiles from "./VoiceProfiles.svelte";

const copy = $derived(copyState.catalog?.voice_lab ?? null);

const tabs = $derived<{ id: VoiceLabTab; label: string }[]>(
	copy
		? [
				{ id: "tts", label: copy.tab_tts },
				{ id: "stt", label: copy.tab_stt },
				{ id: "profiles", label: copy.tab_profiles },
				{ id: "test", label: copy.tab_test },
			]
		: [],
);

function chooseTab(value: string): void {
	const tab = tabs.find((candidate) => candidate.id === value);
	if (tab) voiceState.setTab(tab.id);
}
</script>

{#if copy}
	<Card variant="elevated" class="h-full">
		<Tabs
			value={voiceState.activeTab}
			onValueChange={chooseTab}
			activateOnFocus={false}
			class="flex flex-col h-full min-h-0"
		>
			<!-- Tab bar -->
			<TabsList class="flex px-4">
				{#each tabs as tab (tab.id)}
					<TabsTrigger value={tab.id}>{tab.label}</TabsTrigger>
				{/each}
			</TabsList>

			{#if voiceState.error}
				<div class="flex items-center gap-2 px-4 pt-3">
					<InlineMessage tone="error" class="flex-1 min-w-0">{voiceState.error}</InlineMessage>
					<Button variant="ghost" size="sm" onclick={() => voiceState.clearError()}>
						{copy.dismiss}
					</Button>
				</div>
			{/if}

			<!-- Tab content -->
			<div class="flex-1 overflow-y-auto p-4">
				<TabsContent value="tts"><TtsSetup {copy} /></TabsContent>
				<TabsContent value="stt"><SttSetup {copy} /></TabsContent>
				<TabsContent value="profiles"><VoiceProfiles {copy} /></TabsContent>
				<TabsContent value="test"><TestBench {copy} /></TabsContent>
			</div>
		</Tabs>
	</Card>
{/if}
