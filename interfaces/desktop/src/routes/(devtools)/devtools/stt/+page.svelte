<!--
	@file /devtools/stt — Speech-to-Text devtool
	@route /devtools/stt
	Transcription: model load/unload, mic test, record+transcribe, file upload.
-->
<script lang="ts">
import { Check, Ear, FileAudio, Mic, Play } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import {
	testMicrophone,
	transcribeAudio,
	transcribeAudioFile,
} from "$lib/domains/app/voice/index.js";
import { logInfo } from "$lib/sys/logger.js";

let loadingSlot = $state(false);
let micTesting = $state(false);
let micResult = $state<{ detected: boolean; peak_amplitude: number; avg_amplitude: number } | null>(
	null,
);
let recording = $state(false);
let transcript = $state("");
let transcribing = $state(false);
let fileTranscript = $state("");
let error = $state<string | null>(null);

const sttStatus = $derived(modelsState.statuses["voice.stt"]);
const sttReady = $derived(sttStatus ? isInferenceReady(sttStatus) : false);
const sttSlot = $derived(modelsState.slots.find((s) => s.id === "voice.stt"));

async function loadStt(): Promise<void> {
	loadingSlot = true;
	logInfo("devtools.stt", "Loading voice.stt slot");
	try {
		await modelsState.load("voice.stt");
		logInfo("devtools.stt", "voice.stt loaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.stt", `voice.stt load failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

async function unloadStt(): Promise<void> {
	loadingSlot = true;
	try {
		await modelsState.unload("voice.stt");
		logInfo("devtools.stt", "voice.stt unloaded");
	} finally {
		loadingSlot = false;
	}
}

async function handleMicTest(): Promise<void> {
	micTesting = true;
	error = null;
	logInfo("devtools.stt", "testMicrophone() starting");
	try {
		micResult = await testMicrophone();
		logInfo(
			"devtools.stt",
			`Mic test: detected=${micResult.detected} peak=${micResult.peak_amplitude.toFixed(3)}`,
		);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.stt", `Mic test failed: ${error}`);
	} finally {
		micTesting = false;
	}
}

async function handleRecord(): Promise<void> {
	recording = true;
	transcript = "";
	error = null;
	logInfo("devtools.stt", "transcribeAudio() — 3s capture starting");
	try {
		transcript = await transcribeAudio();
		logInfo("devtools.stt", `Transcript: "${transcript.slice(0, 80)}"`);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.stt", `transcribeAudio failed: ${error}`);
	} finally {
		recording = false;
	}
}

async function handleFileDrop(e: DragEvent): Promise<void> {
	e.preventDefault();
	const file = e.dataTransfer?.files[0];
	if (!file) return;
	transcribing = true;
	fileTranscript = "";
	error = null;
	logInfo("devtools.stt", `transcribeAudioFile() — file=${file.name}`);
	try {
		// Tauri expects a file path, not a blob. Use webkitRelativePath or name.
		// For drag-drop in Tauri, the file path comes from the dataTransfer.
		const path = (file as unknown as { path?: string }).path ?? file.name;
		fileTranscript = await transcribeAudioFile(path);
		logInfo("devtools.stt", `File transcript: "${fileTranscript.slice(0, 80)}"`);
	} catch (e2) {
		error = e2 instanceof Error ? e2.message : String(e2);
		logInfo("devtools.stt", `transcribeAudioFile failed: ${error}`);
	} finally {
		transcribing = false;
	}
}

function handleDragOver(e: DragEvent): void {
	e.preventDefault();
}
</script>

<div class="stt-page">
	<Heading level={2} size="xl">Speech-to-Text</Heading>

	<section class="slot-controls">
		<div class="slot-row">
			<Text size="sm" weight="bold">voice.stt</Text>
			{#if sttReady}
				<Badge tone="positive" size="sm"><Check size={8} /> Ready</Badge>
			{:else if sttSlot?.assigned_model_id}
				<Badge tone="neutral" size="sm">Assigned</Badge>
			{:else}
				<Badge tone="neutral" size="sm">Empty</Badge>
			{/if}
			{#if !sttReady && sttSlot?.assigned_model_id}
				<Button preset="button-primary" size="sm" onclick={loadStt} disabled={loadingSlot}>
					{#if loadingSlot}<Spinner size="xs" />{:else}<Play size={12} />{/if}
					Load
				</Button>
			{/if}
			{#if sttReady}
				<Button preset="button-ghost" size="sm" onclick={unloadStt} disabled={loadingSlot}>Unload</Button>
			{/if}
		</div>
	</section>

	{#if error}
		<div class="error-bar">
			<Text size="sm" class="error-text">{error}</Text>
			<Button preset="button-ghost" size="sm" onclick={() => (error = null)}>Dismiss</Button>
		</div>
	{/if}

	<section class="mic-test">
		<Text size="sm" weight="bold">Microphone Test</Text>
		<Button preset="button-secondary" size="sm" onclick={handleMicTest} disabled={micTesting}>
			{#if micTesting}
				<Spinner size="xs" />
				Testing...
			{:else}
				<Mic size={14} />
				Test Microphone
			{/if}
		</Button>
		{#if micResult}
			<div class="mic-stats">
				<Text size="xs">Detected: {micResult.detected ? "Yes" : "No"}</Text>
				<Text size="xs">Peak: {(micResult.peak_amplitude * 100).toFixed(1)}%</Text>
				<Text size="xs">Average: {(micResult.avg_amplitude * 100).toFixed(1)}%</Text>
			</div>
		{/if}
	</section>

	{#if sttReady}
		<section class="record-section">
			<Text size="sm" weight="bold">Record + Transcribe (3 seconds)</Text>
			<Button preset="button-primary" size="md" onclick={handleRecord} disabled={recording}>
				{#if recording}
					<Spinner size="xs" />
					Recording...
				{:else}
					<Ear size={16} />
					Record
				{/if}
			</Button>
			{#if transcript}
				<div class="transcript-box">
					<Text size="xs" weight="bold" class="transcript-label">Transcript:</Text>
					<Text size="sm">{transcript}</Text>
				</div>
			{/if}
		</section>

		<section
			class="file-section"
			ondrop={handleFileDrop}
			ondragover={handleDragOver}
			aria-label="Drop audio file to transcribe"
		>
			<FileAudio size={24} />
			<Text size="sm" weight="bold">File Transcription</Text>
			<Text size="xs" class="drop-hint">Drop an audio file here (WAV, MP3, FLAC)</Text>
			{#if transcribing}
				<Spinner size="sm" tone="accent" />
				<Text size="xs">Transcribing...</Text>
			{/if}
			{#if fileTranscript}
				<div class="transcript-box">
					<Text size="xs" weight="bold" class="transcript-label">File Transcript:</Text>
					<Text size="sm">{fileTranscript}</Text>
				</div>
			{/if}
		</section>
	{:else}
		<div class="empty-state">
			<Text size="sm" class="empty-text">Load the voice.stt model to access transcription controls.</Text>
		</div>
	{/if}

	<section class="future-section">
		<Text size="sm" weight="bold">Streaming ASR</Text>
		<Text size="xs" class="future-text">
			Current mode: Batch (Whisper). Streaming requires sherpa-onnx OnlineRecognizer
			+ zipformer streaming model (~40MB). Planned for Voice Sprint B.
		</Text>
	</section>
</div>

<style>
	.stt-page {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem;
		max-width: 52rem;
	}

	.slot-controls {
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}

	.slot-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.error-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: oklch(0.35 0.12 25 / 0.15);
		border: 0.0625rem solid oklch(0.5 0.15 25 / 0.3);
	}
	:global(.error-text) { color: var(--signal-error); }

	.mic-test {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.mic-stats {
		display: flex;
		gap: 1rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
	}

	.record-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.transcript-box {
		padding: 0.75rem;
		border-radius: 0.5rem;
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-soft);
	}
	:global(.transcript-label) { color: var(--text-muted); }

	.file-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		border-radius: 0.75rem;
		border: 0.125rem dashed var(--border-soft);
		color: var(--text-muted);
		transition: border-color 150ms ease-out;
	}
	.file-section:hover {
		border-color: var(--accent-teal-main);
	}
	:global(.drop-hint) { color: var(--text-muted); }

	.empty-state {
		padding: 2rem;
		text-align: center;
	}
	:global(.empty-text) { color: var(--text-muted); }

	.future-section {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 1rem;
		border-radius: 0.75rem;
		border: 0.0625rem dashed var(--border-subtle);
		opacity: 0.6;
	}
	:global(.future-text) { color: var(--text-muted); }
</style>
