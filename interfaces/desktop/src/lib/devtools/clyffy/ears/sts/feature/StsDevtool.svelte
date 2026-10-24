<!--
	@file StsDevtool.svelte
	@module @devpulse/devtools/clyffy/ears/sts
	@window DevTools (Ctrl+Shift+Z)

	Wrapped in ServiceDevtoolShell. Bidirectional voice pipeline control
	surface with four domains mapped to the four standard tabs:

	- Status  — voice.stt + voice.tts slot state, last mic test, current
	            smoke-test result.
	- Config  — TODO(reality-gap) per-slot overrides.
	- Logs    — TODO(reality-gap) scoped log view.
	- Actions — Load/Unload each slot, mic test, record+transcribe,
	            speak, voice preview, smoke test, full STS pipeline.

	Slot load/unload shows the ClyffyLoadingBlock (rotating DYK card)
	for the duration. Short actions keep an inline spinner.

	All calls go through real Tauri commands backed by ORT Whisper +
	Kokoro. Wake word + streaming ASR still require sherpa-backend and
	are flagged as future.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
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
import { onMount } from "svelte";
import type { MicTestResult, VoiceInfo } from "$lib/devtools/_shared/voice-contracts.js";
import { voiceSelectionState } from "$lib/devtools/_shared/voice-selection.state.svelte.js";
import {
	DevtoolLogsTab,
	type HealthBadge,
	type LogTargetPreset,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";
import { ClyffyLoadingBlock } from "$lib/domains/clyffy/index.js";
import { capabilityChannel } from "$lib/sys/events/index.js";
import { commands, type VoiceSmokeReport } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";
import { listVoices, previewVoice, speak } from "../../../mouth/tts/data-access/tts.svc.js";
import { ttsConfigState } from "../../../mouth/tts/data-access/tts-config.state.svelte.js";
import {
	testMicrophone,
	transcribeAudio,
	transcribeAudioFile,
} from "../../stt/data-access/stt.svc.js";
import { sttConfigState } from "../../stt/data-access/stt-config.state.svelte.js";
import { runStsPipeline } from "../data-access/sts.svc.js";
import { stsLatencyState } from "../data-access/sts-latency.state.svelte.js";

const LOG_TARGETS: LogTargetPreset[] = [{ value: "devtools.sts", label: "STS devtool" }];

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
// Mount-load via onMount — bailouts read the load-flag the load
// function flips, so $effect would loop. Watcher below is reactive,
// not mount-load — that one stays $effect.
onMount(() => {
	if (!sttConfigState.config && !sttConfigState.loading) {
		void sttConfigState.load();
	}
	if (!ttsConfigState.config && !ttsConfigState.loading) {
		void ttsConfigState.load();
	}
});

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
	const start = performance.now();
	try {
		transcript = await transcribeAudio();
		stsLatencyState.recordStt(performance.now() - start);
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
	const start = performance.now();
	try {
		await speak(ttsInput, voiceSelectionState.selectedVoice, "voice.tts");
		stsLatencyState.recordTts(performance.now() - start);
	} catch (e) {
		error = `TTS failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		speaking = false;
	}
}

async function handlePreview(voice: VoiceInfo): Promise<void> {
	voiceSelectionState.selectedVoice = voice.id;
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
	const start = performance.now();
	try {
		const result = await runStsPipeline(path, "chat.brain", voiceSelectionState.selectedVoice, 256);
		stsTranscript = result.transcript;
		stsReply = result.reply;
		stsLatencyState.recordPipeline(performance.now() - start);
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
	health={badge}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<!-- Per-slot readiness -->
			<div class="flex flex-wrap gap-3">
				<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
					style={sttReady
						? "border-color: var(--accent-service-main); background: var(--accent-service-fill);"
						: "border-color: var(--border-subtle); background: var(--surface-base);"}>
					<Ear size={12} />
					<Text size="xs" weight="bold">STT (Whisper)</Text>
					{#if sttReady}
						<Badge variant="positive" size="sm">Ready</Badge>
					{:else if sttSlot?.assigned_model_id}
						<Badge variant="neutral" size="sm">Assigned</Badge>
					{:else}
						<Badge variant="neutral" size="sm">Empty</Badge>
					{/if}
				</div>

				<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
					style={ttsReady
						? "border-color: var(--accent-service-main); background: var(--accent-service-fill);"
						: "border-color: var(--border-subtle); background: var(--surface-base);"}>
					<Volume2 size={12} />
					<Text size="xs" weight="bold">TTS (Kokoro)</Text>
					{#if ttsReady}
						<Badge variant="positive" size="sm">Ready</Badge>
					{:else if ttsSlot?.assigned_model_id}
						<Badge variant="neutral" size="sm">Assigned</Badge>
					{:else}
						<Badge variant="neutral" size="sm">Empty</Badge>
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

			{#if stsLatencyState.pipelineMs !== null || stsLatencyState.sttMs !== null || stsLatencyState.ttsMs !== null}
				<div
					class="rounded-lg p-3 flex flex-wrap gap-4"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<Text size="xs" weight="bold">Latency</Text>
					{#if stsLatencyState.sttMs !== null}
						<Text size="xs" color="muted">
							STT <span class="font-mono">{stsLatencyState.sttMs}ms</span>
						</Text>
					{/if}
					{#if stsLatencyState.ttsMs !== null}
						<Text size="xs" color="muted">
							TTS <span class="font-mono">{stsLatencyState.ttsMs}ms</span>
						</Text>
					{/if}
					{#if stsLatencyState.pipelineMs !== null}
						<Text size="xs" color="muted">
							Pipeline <span class="font-mono">{stsLatencyState.pipelineMs}ms</span>
						</Text>
					{/if}
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
				<div
					role="alert"
					aria-live="assertive"
					class="rounded-lg p-3"
					style="background: color-mix(in oklch, var(--signal-error) 18%, transparent); border: 1px solid var(--signal-error);"
				>
					<Text size="xs">{error}</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-5">
			<Text size="xs" color="muted">
				STS straddles the <span class="font-mono">voice.stt</span> and
				<span class="font-mono">voice.tts</span> slots. Config below is
				the union of both per-slot configs — saving here writes through to
				each slot's user TOML.
			</Text>

			{#if sttConfigState.error}
				<div
					role="alert"
					aria-live="assertive"
					class="p-3 rounded-lg text-xs"
					style="background: color-mix(in oklch, var(--signal-error) 12%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 40%, transparent); color: var(--signal-error);"
				>
					STT config: {sttConfigState.error}
				</div>
			{/if}
			{#if ttsConfigState.error}
				<div
					role="alert"
					aria-live="assertive"
					class="p-3 rounded-lg text-xs"
					style="background: color-mix(in oklch, var(--signal-error) 12%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 40%, transparent); color: var(--signal-error);"
				>
					TTS config: {ttsConfigState.error}
				</div>
			{/if}

			{#if ttsConfigState.config}
				<div class="space-y-2">
					<Text size="xs" weight="bold" color="muted">Default voice (TTS)</Text>
					<input
						type="text"
						bind:value={ttsConfigState.draft.default_voice}
						placeholder="qwen3:ryan"
						class="w-full max-w-80 rounded px-2 py-1 text-xs font-mono outline-none"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
					/>
				</div>

				<div class="space-y-2">
					<Text size="xs" weight="bold" color="muted">
						Default speed · {ttsConfigState.draft.default_speed.toFixed(2)}×
					</Text>
					<input
						type="range"
						min="0.5"
						max="2.0"
						step="0.05"
						bind:value={ttsConfigState.draft.default_speed}
						aria-label="Default TTS speech speed (0.5× to 2.0×)"
						aria-valuetext={`${ttsConfigState.draft.default_speed.toFixed(2)}×`}
						class="w-full max-w-80"
						style="accent-color: var(--accent-service-main);"
					/>
				</div>
			{/if}

			{#if sttConfigState.config}
				<div class="space-y-2">
					<Text size="xs" weight="bold" color="muted">
						VAD threshold · {sttConfigState.draft.vad_threshold.toFixed(2)}
					</Text>
					<input
						type="range"
						min="0.0"
						max="1.0"
						step="0.05"
						bind:value={sttConfigState.draft.vad_threshold}
						aria-label="Voice activity detection threshold (0 to 1)"
						class="w-full max-w-80"
						style="accent-color: var(--accent-service-main);"
					/>
					<Text size="xs" color="muted">
						Lower = more sensitive (triggers on quieter audio).
					</Text>
				</div>

				<div class="space-y-2">
					<Text size="xs" weight="bold" color="muted">
						Beam size · {sttConfigState.draft.beam_size}
					</Text>
					<input
						type="range"
						min="1"
						max="10"
						step="1"
						bind:value={sttConfigState.draft.beam_size}
						aria-label="Whisper beam size (1 to 10)"
						aria-valuetext={`${sttConfigState.draft.beam_size} (${sttConfigState.draft.beam_size === 1 ? "greedy" : sttConfigState.draft.beam_size <= 5 ? "balanced" : "max quality"})`}
						class="w-full max-w-80"
						style="accent-color: var(--accent-service-main);"
					/>
					<Text size="xs" color="muted">
						1 = greedy (fastest). 5 = quality default. 10 = max.
					</Text>
				</div>
			{/if}

			<div class="flex items-center gap-2 pt-2">
				<Button
					variant="primary"
					size="sm"
					onclick={async () => {
						if (ttsConfigState.dirty) await ttsConfigState.save();
						if (sttConfigState.dirty) await sttConfigState.save();
					}}
					disabled={(!ttsConfigState.dirty && !sttConfigState.dirty) ||
						ttsConfigState.saving ||
						sttConfigState.saving}
				>
					{#if ttsConfigState.saving || sttConfigState.saving}
						<Spinner size="xs" />
						Saving…
					{:else}
						Save both
					{/if}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => {
						ttsConfigState.reset();
						sttConfigState.reset();
					}}
					disabled={!ttsConfigState.dirty && !sttConfigState.dirty}
				>
					Discard
				</Button>
				{#if ttsConfigState.dirty || sttConfigState.dirty}
					<Text size="xs" color="muted">Unsaved changes</Text>
				{/if}
			</div>
		</div>
	{/snippet}

	{#snippet logs()}
		<DevtoolLogsTab targetPresets={LOG_TARGETS} />
	{/snippet}

	{#snippet actions()}
		{#if anySlotLoading}
			<ClyffyLoadingBlock
				title="Loading voice pipeline"
				subtitle="Safely loading into RAM / VRAM — sit tight."
				kind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<!-- Slot controls (both STT + TTS) -->
				<div class="flex flex-wrap items-center gap-2">
					{#if !sttReady && sttSlot?.assigned_model_id}
						<Button variant="primary" size="sm" onclick={() => handleLoadSlot("voice.stt", (v) => { loadingStt = v; })}>
							<Play size={12} />
							Load Whisper
						</Button>
					{/if}
					{#if sttReady}
						<Button variant="ghost" size="sm" onclick={() => handleUnloadSlot("voice.stt", (v) => { loadingStt = v; })}>
							<PowerOff size={12} />
							Unload Whisper
						</Button>
					{/if}
					{#if !ttsReady && ttsSlot?.assigned_model_id}
						<Button variant="primary" size="sm" onclick={() => handleLoadSlot("voice.tts", (v) => { loadingTts = v; })}>
							<Play size={12} />
							Load Kokoro
						</Button>
					{/if}
					{#if ttsReady}
						<Button variant="ghost" size="sm" onclick={() => handleUnloadSlot("voice.tts", (v) => { loadingTts = v; })}>
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
							<Mic size={16} style="color: var(--accent-service-main);" />
							<Text size="sm" weight="semibold">Speech-to-Text</Text>
						</div>

						<div class="flex items-center gap-2">
							<Button variant="secondary" size="sm" onclick={handleMicTest} disabled={testingMic}>
								{testingMic ? "Testing…" : "Test mic"}
							</Button>
							{#if micResult}
								<Text size="xs" color="muted">
									{micResult.detected ? "Detected" : "No mic"}
								</Text>
							{/if}
						</div>

						<div class="flex items-center gap-2">
							<Button variant="primary" size="sm" onclick={handleRecord} disabled={recording || !sttReady}>
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
							<Volume2 size={16} style="color: var(--accent-service-main);" />
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
							<Button variant="primary" size="sm" onclick={handleSpeak} disabled={speaking || !ttsInput.trim() || !ttsReady}>
								{#if speaking}
									<Spinner size="xs" />
									Speaking…
								{:else}
									<Play size={14} />
									Speak
								{/if}
							</Button>
							<Text size="xs" color="muted">Voice: {voiceSelectionState.selectedVoice}</Text>
						</div>

						{#if voices.length > 0}
							<div class="flex flex-wrap gap-1">
								{#each voices.slice(0, 12) as voice (voice.id)}
									<button
										type="button"
										aria-pressed={voiceSelectionState.selectedVoice === voice.id}
										aria-label={`Preview ${voice.label} — ${voice.gender}, ${voice.language}.`}
										class="px-2 py-1 rounded text-xs border transition-colors"
										style={voiceSelectionState.selectedVoice === voice.id
											? "background: var(--accent-service-fill); color: var(--accent-service-main); border-color: var(--accent-service-main);"
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
							<Activity size={16} style="color: var(--accent-service-main);" />
							<Text size="sm" weight="semibold">Smoke test (TTS → STT round-trip)</Text>
						</div>
						<Text size="xs" color="muted">
							Synthesizes a phrase via TTS, feeds it directly into STT.
							Tests both pipelines without mic or speakers.
						</Text>
						<Button variant="secondary" size="sm" onclick={handleSmokeTest} disabled={smokeTesting || !(sttReady && ttsReady)}>
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
							<Radio size={16} style="color: var(--accent-service-main);" />
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
									? "background: var(--accent-service-fill); color: var(--accent-service-main); border-color: var(--accent-service-main);"
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
							<div class="rounded-lg p-3" style="background: var(--surface-raised); border: 1px solid var(--accent-service-main);">
								<Text size="xs" weight="bold">Clyffy replied</Text>
								<Text size="xs">{stsReply}</Text>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	{/snippet}

	{#snippet debug()}
		<div class="space-y-3">
			<Text size="sm" color="muted">
				Power-user probes. STS is a composed pipeline (mic → STT →
				LLM → TTS); a failure usually points at a specific stage
				rather than the orchestrator. The probe runs the full chain
				against a short fixed prompt so you can localize the break.
			</Text>
			<div class="rounded p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
				<Text size="sm" weight="bold" class="block mb-2">Voice slot state</Text>
				<div class="text-xs space-y-1">
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">Active voice</span>
						<span class="font-mono">{voiceSelectionState.selectedVoice}</span>
					</div>
					<div class="flex justify-between">
						<span style="color: var(--text-secondary)">TTS slot</span>
						<span class="font-mono">{voiceSelectionState.selectedTtsSlot}</span>
					</div>
				</div>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
