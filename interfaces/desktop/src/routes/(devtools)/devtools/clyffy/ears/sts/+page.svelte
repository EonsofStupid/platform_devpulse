<!--
	@file /devtools/clyffy/ears/sts — Speech-to-Speech devtool
	@route /devtools/clyffy/ears/sts
	@window DevTools (Ctrl+Shift+Z)

	Wrapped in ServiceDevtoolShell. Bidirectional voice pipeline control
	surface with four domains mapped to the four standard tabs:

	- Status  — voice.stt + voice.tts slot state, last mic test, current
	            smoke-test result.
	- Config  — TODO(reality-gap) per-slot overrides.
	- Logs    — TODO(reality-gap) scoped log view.
	- Actions — Load/Unload each slot, mic test, record+transcribe,
	            speak, voice preview, smoke test, full STS pipeline.

	Slot load/unload shows the Clyffy LoadingBlock (rotating DYK card)
	for the duration. Short actions keep an inline spinner.

	All calls go through real Tauri commands backed by ORT Whisper +
	Kokoro. Wake word + streaming ASR still require sherpa-backend and
	are flagged as future.
-->
<script lang="ts">
import {
	Activity,
	Ear,
	FileAudio,
	Mic,
	MicOff,
	Play,
	PowerOff,
	Radio,
	Volume2,
} from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/devtools/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";
import {
	listVoices,
	type MicTestResult,
	previewVoice,
	runStsPipeline,
	speak,
	testMicrophone,
	transcribeAudio,
	transcribeAudioFile,
	type VoiceInfo,
	voiceState,
} from "$lib/domains/app/voice/index.js";
import { capabilityChannel } from "$lib/sys/events/index.js";
import { commands, type VoiceSmokeReport } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

// ── State ──────────────────────────────────────────────────
let voices = $state<VoiceInfo[]>([]);
let micResult = $state<MicTestResult | null>(null);
let smokeReport = $state<VoiceSmokeReport | null>(null);

let testingMic = $state(false);
let recording = $state(false);
let speaking = $state(false);
let smokeTesting = $state(false);
let runningPipeline = $state(false);

let loadingStt = $state(false);
let loadingTts = $state(false);

let transcript = $state("");
let ttsInput = $state("Hello, I am Clyffy. Your AI assistant.");
let stsTranscript = $state("");
let stsReply = $state("");
let error = $state<string | null>(null);

// Either slot loading = overlay the whole Actions tab with LoadingBlock.
const anySlotLoading = $derived(loadingStt || loadingTts);

// ── Derived slot state ─────────────────────────────────────
// Two capability channels — STS straddles ears + mouth; readiness
// is the AND of both. Slot metadata still reads `modelsState.slots`
// (published surface, not the forbidden `statuses` lookup).
const sttChannel = capabilityChannel("voice.stt");
const ttsChannel = capabilityChannel("voice.tts");
const sttReady = $derived(sttChannel.ready);
const ttsReady = $derived(ttsChannel.ready);
const sttSlot = $derived(modelsState.slots.find((s) => s.id === "voice.stt"));
const ttsSlot = $derived(modelsState.slots.find((s) => s.id === "voice.tts"));

const badge = $derived<HealthBadge>(
	sttReady && ttsReady
		? { state: "up", label: "Both pipelines ready" }
		: sttReady || ttsReady
			? { state: "degraded", label: sttReady ? "STT only" : "TTS only" }
			: sttSlot?.assigned_model_id || ttsSlot?.assigned_model_id
				? { state: "stopped", label: "Models assigned — not loaded" }
				: { state: "unknown", label: "No voice models assigned" },
);

// ── Init ───────────────────────────────────────────────────
async function refreshVoices(): Promise<void> {
	try {
		voices = await listVoices("voice.tts");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.sts", `listVoices failed: ${error}`);
	}
}

$effect(() => {
	if (ttsReady) {
		void refreshVoices();
	}
});

// ── Slot load/unload (Clyffy spinner while pending) ───────
async function handleLoadSlot(
	slotId: "voice.stt" | "voice.tts",
	setLoading: (v: boolean) => void,
): Promise<void> {
	setLoading(true);
	error = null;
	logInfo("devtools.sts", `Loading slot ${slotId}`);
	try {
		await modelsState.load(slotId);
		logInfo("devtools.sts", `Slot ${slotId} loaded`);
	} catch (e) {
		error = `Load ${slotId} failed: ${e instanceof Error ? e.message : String(e)}`;
		logInfo("devtools.sts", error);
	} finally {
		setLoading(false);
	}
}

async function handleUnloadSlot(
	slotId: "voice.stt" | "voice.tts",
	setLoading: (v: boolean) => void,
): Promise<void> {
	setLoading(true);
	error = null;
	logInfo("devtools.sts", `Unloading slot ${slotId}`);
	try {
		await modelsState.unload(slotId);
		logInfo("devtools.sts", `Slot ${slotId} unloaded`);
	} catch (e) {
		error = `Unload ${slotId} failed: ${e instanceof Error ? e.message : String(e)}`;
		logInfo("devtools.sts", error);
	} finally {
		setLoading(false);
	}
}

// ── Short-duration handlers ────────────────────────────────
async function handleMicTest(): Promise<void> {
	testingMic = true;
	error = null;
	try {
		micResult = await testMicrophone();
		logInfo(
			"devtools.sts",
			`Mic test: detected=${micResult.detected} peak=${micResult.peak_amplitude.toFixed(3)}`,
		);
	} catch (e) {
		error = `Mic test failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		testingMic = false;
	}
}

async function handleRecord(): Promise<void> {
	recording = true;
	error = null;
	try {
		transcript = await transcribeAudio();
	} catch (e) {
		error = `STT failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		recording = false;
	}
}

async function handleSpeak(): Promise<void> {
	if (!ttsInput.trim()) return;
	speaking = true;
	error = null;
	try {
		await speak(ttsInput, voiceState.selectedVoice, "voice.tts");
	} catch (e) {
		error = `TTS failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		speaking = false;
	}
}

async function handlePreview(voice: VoiceInfo): Promise<void> {
	voiceState.selectedVoice = voice.id;
	error = null;
	try {
		await previewVoice(voice.id, "voice.tts");
	} catch (e) {
		error = `Preview failed: ${e instanceof Error ? e.message : String(e)}`;
	}
}

async function handleSmokeTest(): Promise<void> {
	smokeTesting = true;
	smokeReport = null;
	error = null;
	try {
		const result = await commands.voiceSmokeTest();
		if (result.status === "ok") {
			smokeReport = result.data;
		} else {
			error = typeof result.error === "string" ? result.error : JSON.stringify(result.error);
		}
	} catch (e) {
		error = `Smoke test failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		smokeTesting = false;
	}
}

async function handleStsFile(event: Event): Promise<void> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const path = (file as unknown as { path?: string }).path;
	if (!path) {
		error = "Could not resolve file path — use native dialog";
		return;
	}
	runningPipeline = true;
	stsTranscript = "";
	stsReply = "";
	error = null;
	try {
		const result = await runStsPipeline(path, "chat.brain", voiceState.selectedVoice, 256);
		stsTranscript = result.transcript;
		stsReply = result.reply;
	} catch (e) {
		error = `STS pipeline failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		runningPipeline = false;
		input.value = "";
	}
}

async function handleTranscribeFile(event: Event): Promise<void> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const path = (file as unknown as { path?: string }).path;
	if (!path) {
		error = "Could not resolve file path";
		return;
	}
	error = null;
	try {
		transcript = await transcribeAudioFile(path);
	} catch (e) {
		error = `Transcribe failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		input.value = "";
	}
}
</script>

<ServiceDevtoolShell
	title="Speech-to-Speech"
	description="Bidirectional voice pipeline — Whisper + Kokoro"
	icon={Radio}
	axis="capabilities"
	accent="purple"
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<!-- Per-slot readiness -->
			<div class="flex flex-wrap gap-3">
				<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
					style={sttReady
						? "border-color: var(--accent-teal-main); background: var(--accent-teal-fill);"
						: "border-color: var(--border-subtle); background: var(--surface-base);"}>
					<Ear size={12} />
					<Text size="xs" weight="bold">STT (Whisper)</Text>
					{#if sttReady}
						<Badge tone="positive" size="sm">Ready</Badge>
					{:else if sttSlot?.assigned_model_id}
						<Badge tone="neutral" size="sm">Assigned</Badge>
					{:else}
						<Badge tone="neutral" size="sm">Empty</Badge>
					{/if}
				</div>

				<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
					style={ttsReady
						? "border-color: var(--accent-teal-main); background: var(--accent-teal-fill);"
						: "border-color: var(--border-subtle); background: var(--surface-base);"}>
					<Volume2 size={12} />
					<Text size="xs" weight="bold">TTS (Kokoro)</Text>
					{#if ttsReady}
						<Badge tone="positive" size="sm">Ready</Badge>
					{:else if ttsSlot?.assigned_model_id}
						<Badge tone="neutral" size="sm">Assigned</Badge>
					{:else}
						<Badge tone="neutral" size="sm">Empty</Badge>
					{/if}
				</div>

				<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border opacity-50"
					style="border-color: var(--border-subtle); background: var(--surface-base);">
					<Ear size={12} />
					<Text size="xs" color="muted">Wake word — requires sherpa</Text>
				</div>
			</div>

			{#if micResult}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Last microphone test</Text>
					<Text size="xs" color="muted">
						Detected: {micResult.detected ? "Yes" : "No"} ·
						Peak: {micResult.peak_amplitude.toFixed(3)} ·
						Avg: {micResult.avg_amplitude.toFixed(3)} ·
						Floor: {micResult.noise_floor.toFixed(4)}
					</Text>
				</div>
			{/if}

			{#if smokeReport}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Last smoke test</Text>
					<Text size="xs" color="muted">
						TTS: <span style="color: {smokeReport.tts_ok ? 'var(--signal-success)' : 'var(--signal-error)'};">{smokeReport.tts_ok ? "PASS" : "FAIL"}</span> ·
						STT: <span style="color: {smokeReport.stt_ok ? 'var(--signal-success)' : 'var(--signal-error)'};">{smokeReport.stt_ok ? "PASS" : "FAIL"}</span> ·
						{smokeReport.duration_ms}ms
					</Text>
					<Text size="xs" color="muted">Spoke: "{smokeReport.spoken}"</Text>
					<Text size="xs">Heard: "{smokeReport.transcript}"</Text>
					{#if smokeReport.error}
						<Text size="xs" style="color: var(--signal-error);">{smokeReport.error}</Text>
					{/if}
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
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-21): Per-slot STS config (default voice,
			listening gain, VAD threshold, end-of-turn silence window) not yet
			exposed as a Tauri command. The <code>voice_state</code> singleton
			holds session-scoped prefs; persistent config arrives with
			<code>voice_sts_save_config</code>.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-21): STS-scoped log filter not yet wired.
			Session logs live at <span class="font-mono text-[10px]">.userdata/logs/session-*.jsonl</span> —
			filter by <code>component=devtools.sts</code>.
		</Text>
	{/snippet}

	{#snippet actions()}
		{#if anySlotLoading}
			<LoadingBlock
				title="Loading voice pipeline"
				subtitle="Safely loading into RAM / VRAM — sit tight."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<!-- Slot controls (both STT + TTS) -->
				<div class="flex flex-wrap items-center gap-2">
					{#if !sttReady && sttSlot?.assigned_model_id}
						<Button preset="button-primary" size="sm" onclick={() => handleLoadSlot("voice.stt", (v) => { loadingStt = v; })}>
							<Play size={12} />
							Load Whisper
						</Button>
					{/if}
					{#if sttReady}
						<Button preset="button-ghost" size="sm" onclick={() => handleUnloadSlot("voice.stt", (v) => { loadingStt = v; })}>
							<PowerOff size={12} />
							Unload Whisper
						</Button>
					{/if}
					{#if !ttsReady && ttsSlot?.assigned_model_id}
						<Button preset="button-primary" size="sm" onclick={() => handleLoadSlot("voice.tts", (v) => { loadingTts = v; })}>
							<Play size={12} />
							Load Kokoro
						</Button>
					{/if}
					{#if ttsReady}
						<Button preset="button-ghost" size="sm" onclick={() => handleUnloadSlot("voice.tts", (v) => { loadingTts = v; })}>
							<PowerOff size={12} />
							Unload Kokoro
						</Button>
					{/if}
				</div>

				<!-- 2-column grid: STT left, TTS right -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
					<!-- STT -->
					<div class="rounded-lg p-4 flex flex-col gap-3"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						<div class="flex items-center gap-2">
							<Mic size={16} style="color: var(--accent-teal-main);" />
							<Text size="sm" weight="semibold">Speech-to-Text</Text>
						</div>

						<div class="flex items-center gap-2">
							<Button preset="button-secondary" size="sm" onclick={handleMicTest} disabled={testingMic}>
								{testingMic ? "Testing…" : "Test mic"}
							</Button>
							{#if micResult}
								<Text size="xs" color="muted">
									{micResult.detected ? "Detected" : "No mic"}
								</Text>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<Button preset="button-primary" size="sm" onclick={handleRecord} disabled={recording || !sttReady}>
								{#if recording}
									<MicOff size={14} />
									Recording 3 s…
								{:else}
									<Mic size={14} />
									Record + transcribe
								{/if}
							</Button>
							<label class="cursor-pointer">
								<input
									type="file"
									accept="audio/*"
									class="hidden"
									onchange={handleTranscribeFile}
									disabled={!sttReady}
								/>
								<span
									class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border"
									style={sttReady
										? "border-color: var(--border-subtle);"
										: "border-color: var(--border-subtle); opacity: 0.5; pointer-events: none;"}
								>
									<FileAudio size={12} />
									Upload file
								</span>
							</label>
						</div>

						{#if transcript}
							<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
								<Text size="xs" weight="bold">Transcript</Text>
								<Text size="xs">{transcript}</Text>
							</div>
						{/if}
					</div>

					<!-- TTS -->
					<div class="rounded-lg p-4 flex flex-col gap-3"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						<div class="flex items-center gap-2">
							<Volume2 size={16} style="color: var(--accent-teal-main);" />
							<Text size="sm" weight="semibold">Text-to-Speech</Text>
						</div>

						<textarea
							bind:value={ttsInput}
							rows={2}
							class="w-full rounded-lg p-2 text-xs resize-none outline-none"
							style="background: var(--surface-raised); border: 1px solid var(--border-subtle); color: var(--text-primary);"
							placeholder="Type text for Clyffy to speak…"
						></textarea>

						<div class="flex items-center gap-2">
							<Button preset="button-primary" size="sm" onclick={handleSpeak} disabled={speaking || !ttsInput.trim() || !ttsReady}>
								{#if speaking}
									<Spinner size="xs" />
									Speaking…
								{:else}
									<Play size={14} />
									Speak
								{/if}
							</Button>
							<Text size="xs" color="muted">Voice: {voiceState.selectedVoice}</Text>
						</div>

						{#if voices.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each voices.slice(0, 12) as voice (voice.id)}
									<button
										type="button"
										class="px-2 py-1 rounded text-xs border transition-colors"
										style={voiceState.selectedVoice === voice.id
											? "background: var(--accent-teal-fill); color: var(--accent-teal-main); border-color: var(--accent-teal-main);"
											: "background: var(--surface-raised); color: var(--text-muted); border-color: transparent;"}
										onclick={() => handlePreview(voice)}
										title={voice.description}
									>
										{voice.label}
									</button>
								{/each}
								{#if voices.length > 12}
									<Text size="xs" color="muted" class="self-center">+{voices.length - 12} more</Text>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Smoke test -->
					<div class="rounded-lg p-4 flex flex-col gap-3"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						<div class="flex items-center gap-2">
							<Activity size={16} style="color: var(--accent-teal-main);" />
							<Text size="sm" weight="semibold">Smoke test (TTS → STT round-trip)</Text>
						</div>
						<Text size="xs" color="muted">
							Synthesizes a phrase via TTS, feeds it directly into STT.
							Tests both pipelines without mic or speakers.
						</Text>
						<Button preset="button-secondary" size="sm" onclick={handleSmokeTest} disabled={smokeTesting || !(sttReady && ttsReady)}>
							{#if smokeTesting}
								<Spinner size="xs" />
								Running…
							{:else}
								Run smoke test
							{/if}
						</Button>
					</div>

					<!-- Full STS pipeline -->
					<div class="rounded-lg p-4 flex flex-col gap-3"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
						<div class="flex items-center gap-2">
							<Radio size={16} style="color: var(--accent-teal-main);" />
							<Text size="sm" weight="semibold">Full STS pipeline</Text>
						</div>
						<Text size="xs" color="muted">
							Audio file → STT → Brain (chat.brain) → TTS → playback.
							Tests the entire conversation loop.
						</Text>
						<label class="cursor-pointer">
							<input
								type="file"
								accept="audio/*"
								class="hidden"
								onchange={handleStsFile}
								disabled={!(sttReady && ttsReady) || runningPipeline}
							/>
							<span
								class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border"
								style={sttReady && ttsReady && !runningPipeline
									? "background: var(--accent-teal-fill); color: var(--accent-teal-main); border-color: var(--accent-teal-main);"
									: "background: var(--surface-raised); color: var(--text-muted); border-color: var(--border-subtle); opacity: 0.5; pointer-events: none;"}
							>
								<FileAudio size={14} />
								{runningPipeline ? "Running pipeline…" : "Upload audio → run STS"}
							</span>
						</label>
						{#if stsTranscript}
							<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">
								<Text size="xs" weight="bold">You said</Text>
								<Text size="xs" color="muted">{stsTranscript}</Text>
							</div>
						{/if}
						{#if stsReply}
							<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--accent-teal-main);">
								<Text size="xs" weight="bold">Clyffy replied</Text>
								<Text size="xs">{stsReply}</Text>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
