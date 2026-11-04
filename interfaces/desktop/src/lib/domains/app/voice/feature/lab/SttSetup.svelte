<!--
  @file STT Setup tab — speech-to-text slot, mic test, VAD config.
  @domain voice
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Meter } from "@devpulse/coldlight/components/meter";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Slider } from "@devpulse/coldlight/components/slider";
import { Text } from "@devpulse/coldlight/components/text";
import { onMount } from "svelte";
import { fill } from "$lib/sys/copy/index.js";
import {
	ensureSlotLoaded,
	getVoiceStatus,
	listSlots,
	testMicrophone,
} from "../../data-access/voice.service.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import { voiceSttConfigState } from "../../data-access/voice-config.state.svelte.js";
import {
	AUTO_LANGUAGE,
	describeSlotConfig,
	type SlotInfo,
	STT_SLOT,
	type VoiceLabCopy,
	type VoiceStatusInfo,
} from "../../util/voice.contract.js";

let { copy }: { copy: VoiceLabCopy } = $props();

let sttSlot = $state<SlotInfo | null>(null);
let voiceStatus = $state<VoiceStatusInfo | null>(null);
let loadError = $state<string | null>(null);

const shownLanguage = $derived(voiceState.sttLanguage || AUTO_LANGUAGE);
const shownLanguageLabel = $derived(
	copy.stt.languages.find((lang: { value: string }) => lang.value === shownLanguage)?.label ??
		shownLanguage,
);
const micLevel = $derived(
	voiceState.micTest ? Math.round(voiceState.micTest.avg_amplitude * 100) : 0,
);

async function refreshSttRuntime(): Promise<void> {
	try {
		const [status, slots] = await Promise.all([getVoiceStatus(), listSlots()]);
		voiceStatus = status;
		sttSlot = slots.find((slot) => slot.id === STT_SLOT) ?? null;
		loadError = null;
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	}
}

onMount(() => {
	void refreshSttRuntime();
	if (!voiceSttConfigState.config && !voiceSttConfigState.loading) {
		void voiceSttConfigState.load();
	}
});

function chooseLanguage(value: string): void {
	voiceState.sttLanguage = value === AUTO_LANGUAGE ? "" : value;
}

async function handleLoadStt(): Promise<void> {
	voiceState.loading = true;
	try {
		await ensureSlotLoaded(STT_SLOT);
		await refreshSttRuntime();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		voiceState.loading = false;
	}
}

async function handleMicTest(): Promise<void> {
	voiceState.loading = true;
	try {
		voiceState.micTest = await testMicrophone();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		voiceState.loading = false;
	}
}
</script>

<div class="flex flex-col gap-6">
	<InlineMessage tone="warning">
		{fill(copy.stt.endpoint_unavailable, { slot: STT_SLOT })}
	</InlineMessage>

	<!-- Model status -->
	<div class="flex items-center justify-between gap-4">
		<div class="flex flex-col gap-1">
			<Text size="sm" weight="semibold">{sttSlot?.label ?? copy.stt.input_fallback}</Text>
			<Text size="sm" color="muted">{fill(copy.slot_line, { slot: STT_SLOT })}</Text>
			<Text size="sm" color="muted">
				{fill(copy.slot_status, {
					state: voiceStatus?.stt_loaded ? copy.loaded : copy.not_loaded,
					runtime: sttSlot?.runtime ?? copy.unknown_backend,
					loading: sttSlot?.loading_strategy ?? copy.unknown_loading,
				})}
			</Text>
			<Text size="sm" color="muted">{describeSlotConfig(sttSlot, copy)}</Text>
		</div>
		<div class="flex items-center gap-3">
			<Text size="sm">{copy.stt.language}</Text>
			<Select
				value={shownLanguage}
				onValueChange={chooseLanguage}
				disabled={voiceSttConfigState.config === null}
			>
				<SelectTrigger aria-label={copy.stt.language}>{shownLanguageLabel}</SelectTrigger>
				<SelectContent>
					{#each copy.stt.languages as lang (lang.value)}
						<SelectItem value={lang.value}>{lang.label}</SelectItem>
					{/each}
				</SelectContent>
			</Select>
			<Button
				variant="secondary"
				size="sm"
				onclick={handleLoadStt}
				disabled={voiceState.loading || voiceStatus?.stt_loaded}
			>
				{voiceStatus?.stt_loaded ? copy.loaded : copy.stt.load}
			</Button>
		</div>
	</div>

	{#if loadError}
		<InlineMessage tone="error">{loadError}</InlineMessage>
	{/if}
	{#if voiceSttConfigState.error}
		<InlineMessage tone="error">{voiceSttConfigState.error}</InlineMessage>
	{/if}

	<!-- Microphone test -->
	<Card variant="minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold">{copy.stt.mic_title}</Text>

			{#if voiceState.micTest}
				<div class="flex flex-col gap-1">
					<Text size="sm">
						{voiceState.micTest.detected ? copy.stt.mic_detected : copy.stt.mic_missing}
					</Text>
					<div class="flex items-center gap-2">
						<Text size="sm" class="w-12">{copy.stt.level}</Text>
						<Meter value={micLevel} aria-label={copy.stt.level} class="flex-1" />
						<Text size="sm" class="w-10 text-right">{micLevel}%</Text>
					</div>
					<Text size="sm" color="muted">
						{fill(copy.stt.levels, {
							peak: voiceState.micTest.peak_amplitude.toFixed(2),
							avg: voiceState.micTest.avg_amplitude.toFixed(2),
							floor: voiceState.micTest.noise_floor.toFixed(3),
						})}
					</Text>
				</div>
			{/if}

			<Button variant="primary" size="sm" onclick={handleMicTest} disabled={voiceState.loading}>
				{voiceState.loading ? copy.stt.recording : copy.stt.test_mic}
			</Button>
		</div>
	</Card>

	<!-- VAD Sensitivity -->
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-4">
			<Text size="sm" class="w-28">{copy.stt.vad}</Text>
			<Slider
				min={0}
				max={1}
				step={0.05}
				value={voiceState.vadSensitivity}
				onValueChange={(threshold) => (voiceState.vadSensitivity = threshold)}
				disabled={voiceSttConfigState.config === null}
				aria-label={copy.stt.vad}
				class="flex-1"
			/>
			<Text size="sm" class="w-10 text-right">{voiceState.vadSensitivity.toFixed(2)}</Text>
		</div>
		<Text size="sm" color="muted">{copy.stt.vad_hint}</Text>
		<Text size="sm" color="muted">{copy.stt.settings_note}</Text>
		{#if voiceSttConfigState.dirty}
			<div class="flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					onclick={() => voiceSttConfigState.save()}
					disabled={voiceSttConfigState.saving}
				>
					{copy.stt.save}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => voiceSttConfigState.reset()}
					disabled={voiceSttConfigState.saving}
				>
					{copy.stt.reset}
				</Button>
			</div>
		{/if}
	</div>

	<!-- Runtime note -->
	<Card surface="glass" variant="minimal">
		<div class="p-3 flex items-center justify-between gap-4">
			<div class="flex flex-col gap-1">
				<Text size="sm" weight="semibold">{copy.stt.note_title}</Text>
				<Text size="sm" color="muted">{fill(copy.stt.note_body, { slot: STT_SLOT })}</Text>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={handleLoadStt}
				disabled={voiceState.loading || voiceStatus?.stt_loaded}
			>
				{voiceStatus?.stt_loaded ? copy.stt.ready : copy.stt.load_now}
			</Button>
		</div>
	</Card>
</div>
