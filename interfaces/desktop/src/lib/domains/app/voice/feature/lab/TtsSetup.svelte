<!--
  @file TTS Setup tab — choose a connection or model, preview voices, set defaults.
  @domain voice
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Slider } from "@devpulse/coldlight/components/slider";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { onMount } from "svelte";
import { fill } from "#lib/sys/copy/index.js";
import {
	ensureSlotLoaded,
	ensureSpeechReady,
	getVoiceStatus,
	listSlots,
	listVoices,
	pickAudioFile,
	previewVoice,
	runStsPipeline,
	setDefaultVoiceProfile,
	transcribeAudioFile,
} from "../../data-access/voice.service.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import { voiceTtsConfigState } from "../../data-access/voice-config.state.svelte.js";
import { voiceEndpointsState } from "../../data-access/voice-endpoints.state.svelte.js";
import {
	describeSlotConfig,
	type SlotInfo,
	STS_BRAIN_SLOT,
	STT_SLOT,
	VOICE_BRAIN_SLOT,
	type VoiceInfo,
	type VoiceLabCopy,
	type VoiceStatusInfo,
} from "../../util/voice.contract.js";
import SpeechEndpointSetup from "./SpeechEndpointSetup.svelte";

let { copy }: { copy: VoiceLabCopy } = $props();

// Voices are loaded from the Rust registry at runtime — never hardcoded.
const voices = $derived(voiceState.ttsVoices);
let loadError = $state<string | null>(null);
let filterGender = $state("all");
let voiceStatus = $state<VoiceStatusInfo | null>(null);
let ttsSlot = $state<SlotInfo | null>(null);
let voiceBrainSlot = $state<SlotInfo | null>(null);
/** The saved default voice's id, the one speaking reads when none is picked. */
const defaultVoice = $derived(voiceTtsConfigState.config?.default_voice ?? null);
/** A chosen connection has its own voices, which the registry cannot list. */
const speakingAtEndpoint = $derived(voiceEndpointsState.binding("tts") !== null);
let savingDefault = $state(false);
let fileRunning = $state(false);

const filters = $derived([
	{ value: "all", label: copy.tts.filter_all },
	{ value: "female", label: copy.tts.filter_female },
	{ value: "male", label: copy.tts.filter_male },
	{ value: "neutral", label: copy.tts.filter_neutral },
]);
const filterLabel = $derived(filters.find((f) => f.value === filterGender)?.label ?? filterGender);
const filteredVoices = $derived(
	filterGender === "all" ? voices : voices.filter((v) => v.gender === filterGender),
);

function voiceLabelFor(voiceId: string | null): string {
	if (!voiceId) return copy.tts.no_default;
	return voices.find((voice) => voice.id === voiceId)?.label ?? voiceId;
}

async function refreshVoiceRuntime(): Promise<void> {
	try {
		const [voiceList, status, slots] = await Promise.all([
			listVoices(voiceState.selectedTtsSlot),
			getVoiceStatus(),
			listSlots(),
		]);

		voiceState.ttsVoices = voiceList;
		voiceStatus = status;
		ttsSlot = slots.find((slot) => slot.id === voiceState.selectedTtsSlot) ?? null;
		voiceBrainSlot = slots.find((slot) => slot.id === VOICE_BRAIN_SLOT) ?? null;

		if (status.tts_endpoint) {
			voiceState.selectedVoice ||= status.active_voice;
		} else if (!voiceList.some((voice) => voice.id === voiceState.selectedVoice)) {
			const active = voiceList.find((voice) => voice.id === status.active_voice);
			voiceState.selectedVoice = active?.id ?? voiceList[0]?.id ?? "";
		}

		loadError = null;
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	}
}

onMount(() => {
	void refreshVoiceRuntime();
	if (!voiceTtsConfigState.config && !voiceTtsConfigState.loading) {
		void voiceTtsConfigState.load();
	}
});

async function handlePreview(voice: VoiceInfo): Promise<void> {
	try {
		await ensureSpeechReady("tts", voiceState.selectedTtsSlot);
		voiceState.selectedVoice = voice.id;
		await previewVoice(voice.id, voiceState.selectedTtsSlot);
		await refreshVoiceRuntime();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}

async function handleTranscribeFile(): Promise<void> {
	fileRunning = true;
	try {
		const path = await pickAudioFile(copy.tts.pick_title);
		if (!path) return;
		await ensureSpeechReady("stt", STT_SLOT);
		voiceState.lastTranscript = await transcribeAudioFile(path);
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		fileRunning = false;
	}
}

async function handleStsRun(): Promise<void> {
	fileRunning = true;
	try {
		const path = await pickAudioFile(copy.tts.pick_title);
		if (!path) return;
		await Promise.all([
			ensureSpeechReady("stt", STT_SLOT),
			ensureSpeechReady("tts", voiceState.selectedTtsSlot),
			ensureSlotLoaded(STS_BRAIN_SLOT),
		]);
		const result = await runStsPipeline(
			path,
			STS_BRAIN_SLOT,
			voiceState.selectedVoice || null,
			null,
		);
		voiceState.lastTranscript = result.transcript;
		voiceState.lastReply = result.reply;
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		fileRunning = false;
	}
}

async function handleLoadVoiceOutput(): Promise<void> {
	try {
		await ensureSlotLoaded(voiceState.selectedTtsSlot);
		await refreshVoiceRuntime();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}

async function handleSetDefaultVoice(): Promise<void> {
	const voice = voices.find((candidate) => candidate.id === voiceState.selectedVoice);
	if (!voice && !speakingAtEndpoint) return;
	savingDefault = true;
	try {
		// The assistant config names a registry voice; a server's own voice lives in the settings.
		if (voice) await setDefaultVoiceProfile(`${voice.engine}:${voice.id}`);
		voiceTtsConfigState.draft.default_voice = voiceState.selectedVoice;
		await voiceTtsConfigState.save();
		await refreshVoiceRuntime();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		savingDefault = false;
	}
}
</script>

<div class="flex flex-col gap-4">
	<SpeechEndpointSetup
		{copy}
		role="tts"
		slot={voiceState.selectedTtsSlot}
		onChanged={refreshVoiceRuntime}
	/>

	<div class="flex gap-6">
		<!-- Left: Live slot cards -->
		<div class="flex flex-col gap-4 w-64 shrink-0">
			<Text size="sm" weight="semibold">{copy.tts.runtime_title}</Text>

			<Card variant="minimal">
				<div class="p-3 flex flex-col gap-2">
					<Text size="sm" weight="semibold">{ttsSlot?.label ?? copy.tts.output_fallback}</Text>
					<Text size="sm" color="muted">
						{fill(copy.slot_line, { slot: voiceState.selectedTtsSlot })}
					</Text>
					<Text size="sm" color="muted">
						{fill(copy.slot_status, {
							state: voiceStatus?.tts_loaded ? copy.loaded : copy.not_loaded,
							runtime: ttsSlot?.runtime ?? copy.unknown_backend,
							loading: ttsSlot?.loading_strategy ?? copy.unknown_loading,
						})}
					</Text>
					<Text size="sm" color="muted">{describeSlotConfig(ttsSlot, copy)}</Text>
					{#if !voiceStatus?.tts_loaded}
						<Button variant="secondary" size="sm" onclick={handleLoadVoiceOutput}>
							{copy.tts.load_output}
						</Button>
					{/if}
				</div>
			</Card>

			<Card variant="minimal">
				<div class="p-3 flex flex-col gap-2">
					<Text size="sm" weight="semibold">
						{voiceBrainSlot?.label ?? copy.tts.conversation_fallback}
					</Text>
					<Text size="sm" color="muted">{fill(copy.slot_line, { slot: VOICE_BRAIN_SLOT })}</Text>
					<Text size="sm" color="muted">
						{voiceBrainSlot?.runtime ?? copy.unknown_backend} · {voiceBrainSlot?.loading_strategy ??
							copy.unknown_loading}
					</Text>
					<Text size="sm" color="muted">
						{fill(copy.tts.conversation_note, { brain: STS_BRAIN_SLOT })}
					</Text>
				</div>
			</Card>
		</div>

		<!-- Right: Voice picker + controls -->
		<Card surface="glass" variant="deep" class="flex-1 min-w-0 gap-4 p-4">
			<div class="flex items-center justify-between gap-4">
				<Text size="sm" weight="semibold">
					{fill(copy.tts.preview_title, { count: voices.length })}
				</Text>
				<div class="flex items-center gap-2">
					<Text size="sm">{copy.tts.filter_label}</Text>
					<Select value={filterGender} onValueChange={(value: string) => (filterGender = value)}>
						<SelectTrigger aria-label={copy.tts.filter_label}>{filterLabel}</SelectTrigger>
						<SelectContent>
							{#each filters as filter (filter.value)}
								<SelectItem value={filter.value}>{filter.label}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			</div>

			{#if loadError}
				<InlineMessage tone="error">{fill(copy.tts.registry_failed, { error: loadError })}</InlineMessage>
			{:else if voices.length === 0}
				<Text size="sm" color="muted">{copy.tts.no_voices}</Text>
			{/if}

			{#if voiceTtsConfigState.error}
				<InlineMessage tone="error">{voiceTtsConfigState.error}</InlineMessage>
			{/if}

			<!-- Voice grid -->
			<div class="grid grid-cols-2 xl:grid-cols-4 gap-2">
				{#each filteredVoices as voice (voice.id)}
					<Card
						as="button"
						variant={voiceState.selectedVoice === voice.id ? "glow" : "minimal"}
						aria-pressed={voiceState.selectedVoice === voice.id}
						class="px-3 py-2 gap-1 text-left"
						onclick={() => handlePreview(voice)}
					>
						<Text size="sm" weight="semibold">{voice.label}</Text>
						<Text size="sm" color="muted">{voice.gender} · {voice.language}</Text>
						<Text size="sm" color="muted" class="truncate">{voice.description}</Text>
					</Card>
				{/each}
			</div>

			{#if speakingAtEndpoint}
				<TextField
					label={copy.endpoints.voice}
					description={copy.endpoints.voice_hint}
					value={voiceState.selectedVoice}
					onValueChange={(voice: string) => (voiceState.selectedVoice = voice)}
					size="sm"
				/>
			{/if}

			<!-- Speed control -->
			<div class="flex items-center gap-4 mt-4">
				<Text size="sm" class="w-16">{copy.tts.speed}</Text>
				<Slider
					min={0.5}
					max={2}
					step={0.05}
					value={voiceState.speechSpeed}
					onValueChange={(speed) => (voiceState.speechSpeed = speed)}
					disabled={voiceTtsConfigState.config === null}
					aria-label={copy.tts.speed}
					class="flex-1"
				/>
				<Text size="sm" class="w-12 text-right">
					{fill(copy.tts.speed_value, { speed: voiceState.speechSpeed.toFixed(2) })}
				</Text>
			</div>
			{#if voiceTtsConfigState.dirty}
				<div class="flex items-center gap-2">
					<Button
						variant="secondary"
						size="sm"
						onclick={() => voiceTtsConfigState.save()}
						disabled={voiceTtsConfigState.saving}
					>
						{copy.tts.save}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onclick={() => voiceTtsConfigState.reset()}
						disabled={voiceTtsConfigState.saving}
					>
						{copy.tts.reset}
					</Button>
				</div>
			{/if}

			<!-- Audio file + STS pipeline -->
			<Card variant="minimal">
				<div class="p-4 flex flex-col gap-3">
					<Text size="sm" weight="semibold">{copy.tts.file_title}</Text>
					<Text size="sm" color="muted">{copy.tts.file_hint}</Text>
					<div class="flex flex-wrap items-center gap-3">
						<Button
							variant="secondary"
							size="sm"
							onclick={handleTranscribeFile}
							disabled={fileRunning}
						>
							{copy.tts.upload_transcribe}
						</Button>
						<Button variant="primary" size="sm" onclick={handleStsRun} disabled={fileRunning}>
							{copy.tts.run_sts}
						</Button>
					</div>
					{#if voiceState.lastTranscript}
						<Card variant="deep">
							<div class="p-2 flex flex-col gap-1">
								<Text size="sm" weight="semibold">{copy.tts.transcript}</Text>
								<Text size="sm" color="muted">{voiceState.lastTranscript}</Text>
							</div>
						</Card>
					{/if}
					{#if voiceState.lastReply}
						<Card variant="glow">
							<div class="p-2 flex flex-col gap-1">
								<Text size="sm" weight="semibold">{copy.tts.reply}</Text>
								<Text size="sm">{voiceState.lastReply}</Text>
							</div>
						</Card>
					{/if}
				</div>
			</Card>

			<!-- Default indicator -->
			<Card variant="deep" orientation="horizontal" class="items-center justify-between gap-4 p-3">
				<Text size="sm">
					{copy.tts.default_voice}
					<Text as="strong" size="sm" weight="semibold">{voiceLabelFor(defaultVoice)}</Text>
				</Text>
				<Button
					variant="primary"
					size="sm"
					onclick={handleSetDefaultVoice}
					disabled={savingDefault || !voiceState.selectedVoice}
				>
					{savingDefault ? copy.tts.saving : copy.tts.set_default}
				</Button>
			</Card>
		</Card>
	</div>
</div>
