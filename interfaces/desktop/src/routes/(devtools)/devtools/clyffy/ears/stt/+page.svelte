<!--
	@file /devtools/clyffy/ears/stt — Speech-to-Text devtool
	@route /devtools/clyffy/ears/stt

	Wrapped in ServiceDevtoolShell (Status/Config/Logs/Actions). Every
	VRAM-touching action (Load slot) presents the Clyffy LoadingBlock —
	rotating DYK/KDROPS/T&T card — while pending. Short-duration work
	(mic test, 3-s record) uses inline spinner.

	All IPC goes through `modelsState.load/unload` + the voice domain
	helpers (`testMicrophone`, `transcribeAudio`, `transcribeAudioFile`).
	Preserved features: slot load/unload, mic test, record+transcribe,
	drag-drop file transcription, streaming-ASR future note.
-->
<script lang="ts">
import { Check, Ear, FileAudio, Mic, Play, PowerOff } from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import {
	DevtoolLogsTab,
	type HealthBadge,
	type LogTargetPreset,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";
import {
	testMicrophone,
	transcribeAudio,
	transcribeAudioFile,
	voiceSttConfigState,
} from "$lib/domains/app/voice/index.js";
import { capabilityChannel } from "$lib/sys/events/index.js";
import { logInfo } from "$lib/sys/logger.js";

const LOG_TARGETS: LogTargetPreset[] = [{ value: "devtools.stt", label: "STT devtool" }];

// Mount-load — bailout reads `loading`, which `load()` flips,
// which would loop `$effect`. (See ProjectSwitcher fix.)
onMount(() => {
	if (!voiceSttConfigState.config && !voiceSttConfigState.loading) {
		void voiceSttConfigState.load();
	}
});

// ── State ──────────────────────────────────────────────
let loadingSlot = $state(false);
let micTesting = $state(false);
let micResult = $state<{
	detected: boolean;
	peak_amplitude: number;
	avg_amplitude: number;
} | null>(null);
let recording = $state(false);
let transcript = $state("");
let transcribing = $state(false);
let fileTranscript = $state("");
let error = $state<string | null>(null);

// ── Derived ────────────────────────────────────────────
// Readiness comes from the capability event channel (live signal
// from the engine on `model:capability-rebound`); slot metadata
// (label, assigned_model_id) is the model loader's published
// surface and continues to read from `modelsState.slots`.
const sttChannel = capabilityChannel("voice.stt");
const sttReady = $derived(sttChannel.ready);
const sttSlot = $derived(modelsState.slots.find((s) => s.id === "voice.stt"));

const badge = $derived<HealthBadge>(
	sttReady
		? { state: "up", label: "Whisper loaded" }
		: sttSlot?.assigned_model_id
			? { state: "stopped", label: "Model assigned — not loaded" }
			: { state: "unknown", label: "No model assigned" },
);

// ── Slot actions ───────────────────────────────────────
async function loadStt(): Promise<void> {
	loadingSlot = true;
	error = null;
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
	error = null;
	logInfo("devtools.stt", "Unloading voice.stt slot");
	try {
		await modelsState.unload("voice.stt");
		logInfo("devtools.stt", "voice.stt unloaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.stt", `voice.stt unload failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

// ── Short-duration actions ─────────────────────────────
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

<ServiceDevtoolShell
	title="Speech-to-Text"
	description="Whisper — batch transcription"
	icon={Ear}
	axis="capabilities"
	accent="blue"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<Text size="sm" weight="bold">voice.stt</Text>
				{#if sttReady}
					<Badge tone="positive" size="sm">
						<Check size={8} />
						Ready
					</Badge>
				{:else if sttSlot?.assigned_model_id}
					<Badge tone="neutral" size="sm">Assigned</Badge>
				{:else}
					<Badge tone="neutral" size="sm">Empty</Badge>
				{/if}
			</div>

			{#if sttSlot?.assigned_model_id}
				<Text size="xs" color="muted">
					Assigned model id: <span class="font-mono">{sttSlot.assigned_model_id}</span>
				</Text>
			{:else}
				<Text size="xs" color="muted">
					No model assigned. Use the setup wizard's Voice card to pick a
					Whisper build for this slot.
				</Text>
			{/if}

			{#if micResult}
				<div class="mt-2 rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Last microphone test</Text>
					<Text size="xs" color="muted">
						Detected: {micResult.detected ? "Yes" : "No"} ·
						Peak: {(micResult.peak_amplitude * 100).toFixed(1)}% ·
						Average: {(micResult.avg_amplitude * 100).toFixed(1)}%
					</Text>
				</div>
			{/if}

			{#if error}
				<div class="rounded-lg p-3" style="background: var(--signal-error-subtle, #3b1a1a); border: 1px solid var(--signal-error);">
					<Text size="xs">{error}</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-4">
			{#if voiceSttConfigState.loading && !voiceSttConfigState.config}
				<Text size="sm" color="muted">Loading STT config…</Text>
			{/if}

			{#if voiceSttConfigState.error}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{voiceSttConfigState.error}
				</div>
			{/if}

			{#if voiceSttConfigState.config}
				<div class="space-y-3">
					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							Language hint (ISO-639-1, empty = auto-detect)
						</Text>
						<input
							type="text"
							bind:value={voiceSttConfigState.draft.language}
							placeholder="auto"
							maxlength="2"
							class="w-32 rounded px-2 py-1 text-xs font-mono outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						/>
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							Beam size · {voiceSttConfigState.draft.beam_size}
						</Text>
						<input
							type="range"
							min="1"
							max="10"
							step="1"
							bind:value={voiceSttConfigState.draft.beam_size}
							class="w-full max-w-80"
							style="accent-color: var(--accent-teal-main);"
						/>
						<Text size="xs" color="muted">
							1 = greedy (fastest). 5 = quality default. 10 = max.
						</Text>
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							VAD threshold · {voiceSttConfigState.draft.vad_threshold.toFixed(2)}
						</Text>
						<input
							type="range"
							min="0.0"
							max="1.0"
							step="0.05"
							bind:value={voiceSttConfigState.draft.vad_threshold}
							class="w-full max-w-80"
							style="accent-color: var(--accent-teal-main);"
						/>
					</div>

					<div class="flex items-center gap-2 pt-2">
						<Button
							preset="button-primary"
							size="sm"
							onclick={() => void voiceSttConfigState.save()}
							disabled={voiceSttConfigState.saving || !voiceSttConfigState.dirty}
						>
							{#if voiceSttConfigState.saving}
								<Spinner size="xs" />
								Saving…
							{:else}
								Save
							{/if}
						</Button>
						<Button
							preset="button-ghost"
							size="sm"
							onclick={() => voiceSttConfigState.reset()}
							disabled={!voiceSttConfigState.dirty || voiceSttConfigState.saving}
						>
							Discard
						</Button>
						{#if voiceSttConfigState.dirty}
							<Text size="xs" color="muted">Unsaved changes</Text>
						{/if}
					</div>

					<Text size="xs" color="muted">
						Beam clamped to <span class="font-mono">[1, 10]</span>, VAD to
						<span class="font-mono">[0.0, 1.0]</span>. Persisted in
						<span class="font-mono text-[10px]">user/voice_stt.toml</span>.
					</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<DevtoolLogsTab targetPresets={LOG_TARGETS} />
	{/snippet}

	{#snippet actions()}
		{#if loadingSlot}
			<LoadingBlock
				title="Loading Whisper into memory"
				subtitle="Safely loading into RAM / VRAM — sit tight."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<!-- Slot load / unload -->
				<div class="flex flex-wrap items-center gap-2">
					{#if !sttReady && sttSlot?.assigned_model_id}
						<Button preset="button-primary" size="sm" onclick={loadStt}>
							<Play size={12} />
							Load Whisper
						</Button>
					{/if}
					{#if sttReady}
						<Button preset="button-ghost" size="sm" onclick={unloadStt}>
							<PowerOff size={12} />
							Unload Whisper
						</Button>
					{/if}
					{#if !sttSlot?.assigned_model_id}
						<Text size="xs" color="muted">
							Assign a Whisper model in the setup wizard first.
						</Text>
					{/if}
				</div>

				<!-- Mic test -->
				<div class="flex items-center gap-2">
					<Button
						preset="button-secondary"
						size="sm"
						onclick={handleMicTest}
						disabled={micTesting}
					>
						{#if micTesting}
							<Spinner size="xs" />
							Testing…
						{:else}
							<Mic size={14} />
							Test microphone
						{/if}
					</Button>
					<Text size="xs" color="muted">
						Quick 1-second capture to confirm your mic is reachable.
					</Text>
				</div>

				{#if sttReady}
					<!-- Record + transcribe -->
					<div class="flex flex-col gap-2">
						<Text size="sm" weight="bold">Record + transcribe (3 s)</Text>
						<div class="flex items-center gap-2">
							<Button
								preset="button-primary"
								size="md"
								onclick={handleRecord}
								disabled={recording}
							>
								{#if recording}
									<Spinner size="xs" />
									Recording…
								{:else}
									<Ear size={16} />
									Record
								{/if}
							</Button>
						</div>
						{#if transcript}
							<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
								<Text size="xs" weight="bold" color="muted">Transcript</Text>
								<Text size="sm">{transcript}</Text>
							</div>
						{/if}
					</div>

					<!-- File transcription -->
					<div
						class="flex flex-col items-center gap-2 rounded-lg p-6 border-2 border-dashed"
						style="border-color: var(--border-soft); background: var(--surface-base);"
						ondrop={handleFileDrop}
						ondragover={handleDragOver}
						role="region"
						aria-label="Drop audio file to transcribe"
					>
						<FileAudio size={24} />
						<Text size="sm" weight="bold">File transcription</Text>
						<Text size="xs" color="muted">
							Drop an audio file here (WAV, MP3, FLAC).
						</Text>
						{#if transcribing}
							<Spinner size="sm" tone="accent" />
							<Text size="xs" color="muted">Transcribing…</Text>
						{/if}
						{#if fileTranscript}
							<div class="w-full rounded-lg p-3 mt-2" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
								<Text size="xs" weight="bold" color="muted">File transcript</Text>
								<Text size="sm">{fileTranscript}</Text>
							</div>
						{/if}
					</div>
				{:else}
					<Text size="sm" color="muted">
						Load Whisper to unlock the record + file-transcription
						controls above.
					</Text>
				{/if}

				<!-- Future -->
				<div class="rounded-lg p-3 mt-2 opacity-60" style="border: 1px dashed var(--border-subtle);">
					<Text size="sm" weight="bold">Streaming ASR</Text>
					<Text size="xs" color="muted">
						Current mode: batch (Whisper). Streaming requires
						sherpa-onnx OnlineRecognizer + zipformer streaming model
						(~40 MB). Planned for Voice Sprint B.
					</Text>
				</div>
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
