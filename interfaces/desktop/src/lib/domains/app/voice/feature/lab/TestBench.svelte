<!--
  @file Test Bench tab — type→hear, speak→see, smoke test.
  @domain voice
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { Textarea } from "@devpulse/coldlight/components/textarea";
import { Mic, Play, Square } from "lucide-svelte";
import { fill } from "#lib/sys/copy/index.js";
import {
	ensureSlotLoaded,
	runSmokeTest,
	speak,
	stopSpeaking,
	transcribeAudio,
} from "../../data-access/voice.service.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import { STT_SLOT, type VoiceLabCopy, type VoiceSmokeReport } from "../../util/voice.contract.js";

let { copy }: { copy: VoiceLabCopy } = $props();

/** What you typed; the catalog's test line until you do. */
let typed = $state<string | null>(null);
const ttsInput = $derived(typed ?? copy.test.default_text);
let ttsLatency = $state<number | null>(null);
let sttLatency = $state<number | null>(null);
let smokeReport = $state<VoiceSmokeReport | null>(null);
let smokeRunning = $state(false);

async function handleSpeak(): Promise<void> {
	const start = performance.now();
	voiceState.isSpeaking = true;
	try {
		await ensureSlotLoaded(voiceState.selectedTtsSlot);
		await speak(
			ttsInput,
			voiceState.selectedVoice || undefined,
			voiceState.selectedTtsSlot,
			voiceState.speechSpeed,
		);
		ttsLatency = Math.round(performance.now() - start);
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		voiceState.isSpeaking = false;
	}
}

async function handleStop(): Promise<void> {
	try {
		await stopSpeaking();
		voiceState.isSpeaking = false;
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}

async function handleTranscribe(): Promise<void> {
	const start = performance.now();
	voiceState.isListening = true;
	try {
		await ensureSlotLoaded(STT_SLOT);
		voiceState.lastTranscription = await transcribeAudio();
		sttLatency = Math.round(performance.now() - start);
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		voiceState.isListening = false;
	}
}

async function handleSmokeTest(): Promise<void> {
	smokeRunning = true;
	smokeReport = null;
	try {
		await Promise.all([ensureSlotLoaded(voiceState.selectedTtsSlot), ensureSlotLoaded(STT_SLOT)]);
		smokeReport = await runSmokeTest();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		smokeRunning = false;
	}
}
</script>

<div class="flex flex-col gap-6">
	<!-- TTS Test -->
	<Card variant="minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold">{copy.test.tts_title}</Text>

			<Textarea
				value={ttsInput}
				onValueChange={(text) => (typed = text)}
				placeholder={copy.test.placeholder}
				aria-label={copy.test.tts_title}
				rows={3}
				resize="none"
			/>

			<div class="flex items-center gap-3">
				<Text size="sm">{fill(copy.test.voice_line, { voice: voiceState.selectedVoice })}</Text>
				<Text size="sm" color="muted">
					{fill(copy.slot_line, { slot: voiceState.selectedTtsSlot })}
				</Text>
			</div>

			<div class="flex items-center gap-3">
				<Button variant="primary" size="sm" onclick={handleSpeak} disabled={voiceState.isSpeaking}>
					<Play size={14} />
					{copy.test.speak}
				</Button>
				<Button variant="ghost" size="sm" onclick={handleStop} disabled={!voiceState.isSpeaking}>
					<Square size={14} />
					{copy.test.stop}
				</Button>
				{#if ttsLatency !== null}
					<Text size="sm" color="muted">{fill(copy.test.latency, { ms: ttsLatency })}</Text>
				{/if}
			</div>
		</div>
	</Card>

	<!-- STT Test -->
	<Card variant="minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold">{copy.test.stt_title}</Text>

			<Button
				variant={voiceState.isListening ? "danger" : "primary"}
				size="sm"
				onclick={handleTranscribe}
				disabled={voiceState.isListening}
			>
				<Mic size={14} />
				{voiceState.isListening ? copy.test.listening : copy.test.record}
			</Button>

			{#if voiceState.lastTranscription}
				<Card variant="deep">
					<div class="p-3 flex flex-col gap-1">
						<Text size="sm" color="muted">{copy.test.transcription}</Text>
						<Text size="sm">"{voiceState.lastTranscription}"</Text>
					</div>
				</Card>
			{/if}

			{#if sttLatency !== null}
				<Text size="sm" color="muted">{fill(copy.test.latency, { ms: sttLatency })}</Text>
			{/if}
		</div>
	</Card>

	<!-- Pipeline smoke test -->
	<Card surface="glass" variant="minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold">{copy.test.smoke_title}</Text>
			<Text size="sm" color="muted">{copy.test.smoke_hint}</Text>
			<div class="flex items-center gap-3">
				<Button variant="primary" size="sm" onclick={handleSmokeTest} disabled={smokeRunning}>
					{smokeRunning ? copy.test.running : copy.test.run_smoke}
				</Button>
			</div>
			{#if smokeReport}
				<Card variant="deep">
					<div class="p-3 flex flex-col gap-2">
						<Text size="sm">{smokeReport.tts_ok ? copy.test.tts_ok : copy.test.tts_failed}</Text>
						<Text size="sm">{smokeReport.stt_ok ? copy.test.stt_ok : copy.test.stt_failed}</Text>
						<Text size="sm" color="muted">{fill(copy.test.spoken, { text: smokeReport.spoken })}</Text>
						{#if smokeReport.transcript}
							<Text size="sm" color="muted">
								{fill(copy.test.transcript, { text: smokeReport.transcript })}
							</Text>
						{/if}
						<Text size="sm" color="muted">
							{fill(copy.test.duration, { ms: smokeReport.duration_ms })}
						</Text>
						{#if smokeReport.error}
							<InlineMessage tone="error">{smokeReport.error}</InlineMessage>
						{/if}
					</div>
				</Card>
			{/if}
		</div>
	</Card>
</div>
