<!--
	@file /devtools/sts — Speech-to-Speech devtool
	@route /devtools/sts
	@window DevTools (Ctrl+Shift+Z)

	Full STS pipeline control surface. Four sections:
	1. Mic test + STT — record → transcribe via Whisper
	2. TTS — speak text, preview voices, set default
	3. Smoke test — closed-loop TTS→STT round-trip
	4. Full STS pipeline — audio file → STT → brain → TTS → playback

	All calls go through real Tauri commands backed by ORT Whisper + Kokoro.
	Wake word + streaming ASR require sherpa-backend (future sprint).
-->
<script lang="ts">
import {
	Activity,
	Ear,
	FileAudio,
	Mic,
	MicOff,
	Play,
	Power,
	PowerOff,
	Radio,
	RefreshCw,
	Volume2,
} from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
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
import { commands, type VoiceSmokeReport } from "$lib/sys/generated/bindings.js";

// ── State ──────────────────────────────────────────────────────
let voices = $state<VoiceInfo[]>([]);
let micResult = $state<MicTestResult | null>(null);
let smokeReport = $state<VoiceSmokeReport | null>(null);
let sttLoaded = $state(false);
let ttsLoaded = $state(false);
let micDetected = $state(false);

let testingMic = $state(false);
let recording = $state(false);
let speaking = $state(false);
let smokeTesting = $state(false);
let runningPipeline = $state(false);

let loadingStt = $state(false);
let loadingTts = $state(false);
let unloadingStt = $state(false);
let unloadingTts = $state(false);

let transcript = $state("");
let ttsInput = $state("Hello, I am Clyffy. Your AI assistant.");
let stsTranscript = $state("");
let stsReply = $state("");
let error = $state<string | null>(null);

// ── Init ───────────────────────────────────────────────────────
async function refresh(): Promise<void> {
	try {
		const [statusResult, voiceList] = await Promise.all([
			commands.getVoiceStatus(),
			listVoices("voice.tts"),
		]);
		if (statusResult.status === "ok") {
			sttLoaded = statusResult.data.stt_loaded;
			ttsLoaded = statusResult.data.tts_loaded;
			micDetected = statusResult.data.mic_detected;
		}
		voices = voiceList;
		error = null;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
}

$effect(() => {
	void refresh();
});

// ── Slot load/unload ──────────────────────────────────────────
async function handleLoadSlot(slotId: string, setLoading: (v: boolean) => void): Promise<void> {
	setLoading(true);
	error = null;
	try {
		const result = await commands.loadSlot(slotId);
		if (result.status === "error") {
			error = `Load ${slotId} failed: ${typeof result.error === "string" ? result.error : JSON.stringify(result.error)}`;
		}
		await refresh();
	} catch (e) {
		error = `Load ${slotId} failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		setLoading(false);
	}
}

async function handleUnloadSlot(slotId: string, setLoading: (v: boolean) => void): Promise<void> {
	setLoading(true);
	error = null;
	try {
		const result = await commands.unloadSlot(slotId);
		if (result.status === "error") {
			error = `Unload ${slotId} failed: ${result.error}`;
		}
		await refresh();
	} catch (e) {
		error = `Unload ${slotId} failed: ${e instanceof Error ? e.message : String(e)}`;
	} finally {
		setLoading(false);
	}
}

// ── Handlers ───────────────────────────────────────────────────
async function handleMicTest(): Promise<void> {
	testingMic = true;
	error = null;
	try {
		micResult = await testMicrophone();
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
			error = result.error;
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

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<!-- Header -->
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Radio size={18} class="text-[var(--accent-teal-main)]" />
				<Text size="lg" weight="semibold">Speech-to-Speech</Text>
				<button onclick={() => void refresh()} class="ml-auto p-1 rounded hover:bg-[var(--glass-void)]" title="Refresh status">
					<RefreshCw size={14} class="text-[var(--text-muted)]" />
				</button>
			</div>
			<Text size="xs" color="muted">
				Full voice pipeline. Mic → STT (Whisper) → Brain (LLM) → TTS (Kokoro) → Speaker.
			</Text>
		</header>

		<!-- Service controls — load/unload each voice slot -->
		<div class="flex flex-wrap gap-3">
			<!-- STT slot -->
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border {sttLoaded ? 'border-[var(--accent-teal-main)] bg-[var(--accent-teal-fill)]' : 'border-[var(--border-subtle)] bg-[var(--glass-void)]'}">
				<span class="w-2 h-2 rounded-full {sttLoaded ? 'bg-[var(--accent-teal-main)]' : 'bg-[var(--text-muted)]'}"></span>
				<Text size="xs" weight="semibold">STT (Whisper)</Text>
				<Text size="xs" color="muted">{sttLoaded ? "Ready" : "Stopped"}</Text>
				{#if loadingStt || unloadingStt}
					<Spinner size="sm" />
				{:else if sttLoaded}
					<button
						class="p-1 rounded hover:bg-[var(--glass-void)]"
						title="Unload STT model"
						onclick={() => handleUnloadSlot("voice.stt", (v) => { unloadingStt = v; })}
					>
						<PowerOff size={12} class="text-[var(--text-muted)]" />
					</button>
				{:else}
					<button
						class="p-1 rounded hover:bg-[var(--accent-teal-fill)]"
						title="Load STT model"
						onclick={() => handleLoadSlot("voice.stt", (v) => { loadingStt = v; })}
					>
						<Power size={12} class="text-[var(--accent-teal-main)]" />
					</button>
				{/if}
			</div>

			<!-- TTS slot -->
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border {ttsLoaded ? 'border-[var(--accent-teal-main)] bg-[var(--accent-teal-fill)]' : 'border-[var(--border-subtle)] bg-[var(--glass-void)]'}">
				<span class="w-2 h-2 rounded-full {ttsLoaded ? 'bg-[var(--accent-teal-main)]' : 'bg-[var(--text-muted)]'}"></span>
				<Text size="xs" weight="semibold">TTS (Kokoro)</Text>
				<Text size="xs" color="muted">{ttsLoaded ? "Ready" : "Stopped"}</Text>
				{#if loadingTts || unloadingTts}
					<Spinner size="sm" />
				{:else if ttsLoaded}
					<button
						class="p-1 rounded hover:bg-[var(--glass-void)]"
						title="Unload TTS model"
						onclick={() => handleUnloadSlot("voice.tts", (v) => { unloadingTts = v; })}
					>
						<PowerOff size={12} class="text-[var(--text-muted)]" />
					</button>
				{:else}
					<button
						class="p-1 rounded hover:bg-[var(--accent-teal-fill)]"
						title="Load TTS model"
						onclick={() => handleLoadSlot("voice.tts", (v) => { loadingTts = v; })}
					>
						<Power size={12} class="text-[var(--accent-teal-main)]" />
					</button>
				{/if}
			</div>

			<!-- Wake word (future) -->
			<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--glass-void)] opacity-50">
				<Ear size={12} class="text-[var(--text-muted)]" />
				<Text size="xs" color="muted">Wake word — requires sherpa-backend</Text>
			</div>
		</div>

		{#if error}
			<div class="p-2 rounded border border-[var(--signal-error)] bg-[var(--signal-error)]/10">
				<Text size="xs" color="accent">{error}</Text>
			</div>
		{/if}

		<!-- Grid: 2 cols -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

			<!-- ═══ STT Section ═══ -->
			<Card preset="glass-deep">
				<div class="p-4 flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<Mic size={16} class="text-[var(--accent-teal-main)]" />
						<Text size="sm" weight="semibold">Speech-to-Text</Text>
					</div>

					<!-- Mic test -->
					<div class="flex items-center gap-2">
						<Button preset="secondary" size="sm" onclick={handleMicTest} disabled={testingMic}>
							{testingMic ? "Testing..." : "Test Mic"}
						</Button>
						{#if micResult}
							<Text size="xs" color="muted">
								{micResult.detected ? "Detected" : "No mic"} · Peak: {micResult.peak_amplitude.toFixed(3)} · Avg: {micResult.avg_amplitude.toFixed(3)} · Floor: {micResult.noise_floor.toFixed(4)}
							</Text>
						{/if}
					</div>

					<!-- Record + transcribe -->
					<div class="flex items-center gap-2">
						<Button preset="primary" size="sm" onclick={handleRecord} disabled={recording}>
							{#if recording}
								<MicOff size={14} class="mr-1" /> Recording 3s...
							{:else}
								<Mic size={14} class="mr-1" /> Record & Transcribe
							{/if}
						</Button>
						<label class="cursor-pointer">
							<input type="file" accept="audio/*" class="hidden" onchange={handleTranscribeFile} />
							<span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs border border-[var(--border-subtle)] hover:border-[var(--accent-teal-main)]">
								<FileAudio size={12} /> Upload File
							</span>
						</label>
					</div>

					{#if transcript}
						<div class="p-2 rounded bg-[var(--glass-void)] border border-[var(--border-subtle)]">
							<Text size="xs" weight="semibold">Transcript</Text>
							<Text size="xs" color="muted" class="mt-1">{transcript}</Text>
						</div>
					{/if}
				</div>
			</Card>

			<!-- ═══ TTS Section ═══ -->
			<Card preset="glass-deep">
				<div class="p-4 flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<Volume2 size={16} class="text-[var(--accent-teal-main)]" />
						<Text size="sm" weight="semibold">Text-to-Speech</Text>
					</div>

					<!-- Text input + speak -->
					<textarea
						bind:value={ttsInput}
						rows={2}
						class="w-full rounded bg-[var(--glass-void)] border border-[var(--border-subtle)] p-2 text-xs text-[var(--text-primary)] resize-none focus:border-[var(--accent-teal-main)] outline-none"
						placeholder="Type text for Clyffy to speak..."
					></textarea>
					<div class="flex items-center gap-2">
						<Button preset="primary" size="sm" onclick={handleSpeak} disabled={speaking || !ttsInput.trim()}>
							{#if speaking}
								Speaking...
							{:else}
								<Play size={14} class="mr-1" /> Speak
							{/if}
						</Button>
						<Text size="xs" color="muted">Voice: {voiceState.selectedVoice}</Text>
					</div>

					<!-- Voice picker -->
					{#if voices.length > 0}
						<div class="flex flex-wrap gap-1 mt-1">
							{#each voices.slice(0, 12) as voice}
								<button
									class="px-2 py-1 rounded text-xs transition-all
										{voiceState.selectedVoice === voice.id
											? 'bg-[var(--accent-teal-fill)] text-[var(--accent-teal-main)] border border-[var(--accent-teal-main)]'
											: 'bg-[var(--glass-void)] text-[var(--text-muted)] border border-transparent hover:border-[var(--border-subtle)]'}"
									onclick={() => handlePreview(voice)}
									title="{voice.description}"
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
			</Card>

			<!-- ═══ Smoke Test ═══ -->
			<Card preset="glass-deep">
				<div class="p-4 flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<Activity size={16} class="text-[var(--accent-teal-main)]" />
						<Text size="sm" weight="semibold">Smoke Test (TTS → STT Round-Trip)</Text>
					</div>
					<Text size="xs" color="muted">
						Synthesizes a phrase via TTS, feeds it directly into STT. Tests both pipelines without mic or speakers.
					</Text>
					<Button preset="secondary" size="sm" onclick={handleSmokeTest} disabled={smokeTesting}>
						{smokeTesting ? "Running..." : "Run Smoke Test"}
					</Button>
					{#if smokeReport}
						<div class="p-2 rounded bg-[var(--glass-void)] border border-[var(--border-subtle)] flex flex-col gap-1">
							<div class="flex gap-4">
								<Text size="xs">TTS: <span class={smokeReport.tts_ok ? "text-[var(--signal-success)]" : "text-[var(--signal-error)]"}>{smokeReport.tts_ok ? "PASS" : "FAIL"}</span></Text>
								<Text size="xs">STT: <span class={smokeReport.stt_ok ? "text-[var(--signal-success)]" : "text-[var(--signal-error)]"}>{smokeReport.stt_ok ? "PASS" : "FAIL"}</span></Text>
								<Text size="xs" color="muted">{smokeReport.duration_ms}ms</Text>
							</div>
							<Text size="xs" color="muted">Spoke: "{smokeReport.spoken}"</Text>
							<Text size="xs">Heard: "{smokeReport.transcript}"</Text>
							{#if smokeReport.error}
								<Text size="xs" class="text-[var(--signal-error)]">{smokeReport.error}</Text>
							{/if}
						</div>
					{/if}
				</div>
			</Card>

			<!-- ═══ Full STS Pipeline ═══ -->
			<Card preset="glass-deep">
				<div class="p-4 flex flex-col gap-3">
					<div class="flex items-center gap-2">
						<Radio size={16} class="text-[var(--accent-teal-main)]" />
						<Text size="sm" weight="semibold">Full STS Pipeline</Text>
					</div>
					<Text size="xs" color="muted">
						Audio file → STT → Brain (chat.brain) → TTS → Playback. Tests the entire conversation loop.
					</Text>
					<label class="cursor-pointer">
						<input type="file" accept="audio/*" class="hidden" onchange={handleStsFile} />
						<span class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-teal-fill)] border border-[var(--accent-teal-main)] text-[var(--accent-teal-main)] text-xs hover:brightness-125">
							<FileAudio size={14} />
							{runningPipeline ? "Running pipeline..." : "Upload Audio → Run STS"}
						</span>
					</label>
					{#if stsTranscript}
						<div class="p-2 rounded bg-[var(--glass-void)] border border-[var(--border-subtle)]">
							<Text size="xs" weight="semibold">You said:</Text>
							<Text size="xs" color="muted">{stsTranscript}</Text>
						</div>
					{/if}
					{#if stsReply}
						<div class="p-2 rounded bg-[var(--glass-void)] border border-[var(--accent-teal-main)]">
							<Text size="xs" weight="semibold">Clyffy replied:</Text>
							<Text size="xs">{stsReply}</Text>
						</div>
					{/if}
				</div>
			</Card>
		</div>
	</div>
</div>
