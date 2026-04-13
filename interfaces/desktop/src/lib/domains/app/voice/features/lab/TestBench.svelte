<!--
  @file Test Bench tab — type→hear, speak→see, smoke test.
  @domain voice
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { commands, type VoiceSmokeReport } from "$lib/sys/generated/bindings.js";
import { speak, stopSpeaking, transcribeAudio } from "../../services/voice.svc.js";
import { voiceState } from "../../state/voice.state.svelte.js";

let ttsInput = $state("Hello, this is a test of Clyffy's voice system.");
let ttsLatency = $state<number | null>(null);
let sttLatency = $state<number | null>(null);
let smokeReport = $state<VoiceSmokeReport | null>(null);
let smokeRunning = $state(false);

async function ensureSlotLoaded(slotId: string): Promise<void> {
	const result = await commands.loadSlot(slotId);
	if (result.status === "error") {
		throw new Error(result.error);
	}
}

async function handleSpeak(): Promise<void> {
	const start = performance.now();
	voiceState.isSpeaking = true;
	try {
		await ensureSlotLoaded(voiceState.selectedTtsSlot);
		await speak(ttsInput, voiceState.selectedVoice, voiceState.selectedTtsSlot);
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
		await ensureSlotLoaded("voice.stt");
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
		await Promise.all([
			ensureSlotLoaded(voiceState.selectedTtsSlot),
			ensureSlotLoaded("voice.stt"),
		]);
		const result = await commands.voiceSmokeTest();
		if (result.status === "error") {
			throw new Error(result.error);
		}
		smokeReport = result.data;
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		smokeRunning = false;
	}
}
</script>

<div class="flex flex-col gap-6">
	<!-- TTS Test -->
	<Card preset="neuro-minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold" preset="default">TTS Test</Text>

			<textarea
				class="w-full h-20 p-3 rounded-lg bg-[var(--glass-void)] border border-[var(--border-subtle)]
					text-sm text-[var(--text-primary)] resize-none focus:outline-none
					focus:border-[var(--accent-teal-main)]"
				bind:value={ttsInput}
				placeholder="Type something for Clyffy to say..."
			></textarea>

			<div class="flex items-center gap-3">
				<Text size="xs" preset="default">
					Voice: <strong>{voiceState.selectedVoice}</strong>
				</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">
					Slot: {voiceState.selectedTtsSlot}
				</Text>
			</div>

			<div class="flex items-center gap-3">
				<Button preset="primary" size="sm" onclick={handleSpeak} disabled={voiceState.isSpeaking}>
					▶ Speak
				</Button>
				<Button preset="ghost" size="sm" onclick={handleStop} disabled={!voiceState.isSpeaking}>
					■ Stop
				</Button>
				{#if ttsLatency !== null}
					<Text size="xs" preset="default" class="text-[var(--text-muted)]">
						Latency: {ttsLatency}ms
					</Text>
				{/if}
			</div>
		</div>
	</Card>

	<!-- STT Test -->
	<Card preset="neuro-minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold" preset="default">STT Test</Text>

			<Button
				preset={voiceState.isListening ? "danger" : "primary"}
				size="sm"
				onclick={handleTranscribe}
			>
				{voiceState.isListening ? "🎙 Listening..." : "🎙 Hold to Speak"}
			</Button>

			{#if voiceState.lastTranscription}
				<div class="p-3 rounded-lg bg-[var(--glass-void)] border border-[var(--border-subtle)]">
					<Text size="xs" preset="default" class="text-[var(--text-muted)]">Transcription:</Text>
					<Text size="sm" preset="default">"{voiceState.lastTranscription}"</Text>
				</div>
			{/if}

			{#if sttLatency !== null}
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">
					Latency: {sttLatency}ms
				</Text>
			{/if}
		</div>
	</Card>

	<!-- Pipeline smoke test -->
	<Card preset="glass-minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold" preset="default">Pipeline Smoke Test</Text>
			<Text size="xs" preset="default" class="text-[var(--text-muted)]">
				Runs the live TTS slot into the live STT slot and reports which stage failed.
			</Text>
			<div class="flex items-center gap-3">
				<Button preset="primary" size="sm" onclick={handleSmokeTest} disabled={smokeRunning}>
					{smokeRunning ? "Running..." : "Run Smoke Test"}
				</Button>
			</div>
			{#if smokeReport}
				<div class="p-3 rounded-lg bg-[var(--glass-void)] border border-[var(--border-subtle)] flex flex-col gap-2">
					<Text size="xs" preset="default">TTS: {smokeReport.tts_ok ? "OK" : "Failed"}</Text>
					<Text size="xs" preset="default">STT: {smokeReport.stt_ok ? "OK" : "Failed"}</Text>
					<Text size="xs" preset="default" class="text-[var(--text-muted)]">Spoken: {smokeReport.spoken}</Text>
					{#if smokeReport.transcript}
						<Text size="xs" preset="default" class="text-[var(--text-muted)]">Transcript: {smokeReport.transcript}</Text>
					{/if}
					<Text size="xs" preset="default" class="text-[var(--text-muted)]">Duration: {smokeReport.duration_ms}ms</Text>
					{#if smokeReport.error}
						<Text size="xs" preset="default" class="text-[var(--accent-ember-main)]">{smokeReport.error}</Text>
					{/if}
				</div>
			{/if}
		</div>
	</Card>
</div>
