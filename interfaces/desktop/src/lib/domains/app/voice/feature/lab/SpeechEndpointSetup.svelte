<!--
  @file Choose the saved connection one speech role runs through.
  @domain voice
-->
<script lang="ts">
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { onMount } from "svelte";
import { providersState } from "#lib/domains/app/providers/index.js";
import { fill } from "#lib/sys/copy/index.js";
import type { SavedConnection } from "#lib/sys/generated/bindings.js";
import { voiceEndpointsState } from "../../data-access/voice-endpoints.state.svelte.js";
import { SpeechEndpointPicker } from "../../ui/speech-endpoint/index.js";
import type { SpeechRole, VoiceLabCopy } from "../../util/voice.contract.js";

let {
	copy,
	role,
	slot,
	onChanged,
}: {
	copy: VoiceLabCopy;
	role: SpeechRole;
	slot: string;
	/** The choice changed; what depends on it should look again. */
	onChanged: () => void | Promise<void>;
} = $props();

const endpoints = $derived(copy.endpoints);
const connections = $derived(
	(providersState.current?.connections?.items ?? []).filter((connection: SavedConnection) =>
		voiceEndpointsState.current?.providers.includes(connection.provider),
	),
);

onMount(() => {
	void voiceEndpointsState.load();
	return providersState.start();
});

async function choose(connection: SavedConnection, model: string): Promise<void> {
	await voiceEndpointsState.choose(role, connection, model);
	await onChanged();
}

async function stopUsing(): Promise<void> {
	await voiceEndpointsState.stopUsing(role);
	await onChanged();
}
</script>

<SpeechEndpointPicker
	copy={endpoints}
	title={role === "tts" ? endpoints.tts_title : endpoints.stt_title}
	noneLine={fill(role === "tts" ? endpoints.tts_none : endpoints.stt_none, { slot })}
	slotNote={fill(endpoints.using_slot_note, { slot })}
	binding={voiceEndpointsState.binding(role)}
	{connections}
	busy={voiceEndpointsState.busy || providersState.busy}
	onChoose={choose}
	onStopUsing={stopUsing}
/>
{#if voiceEndpointsState.error}
	<InlineMessage tone="error">{voiceEndpointsState.error}</InlineMessage>
{/if}
