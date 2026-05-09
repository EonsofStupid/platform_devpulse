<!--
	@file TtsDevtool.svelte
	@module @devpulse/devtools/clyffy/mouth/tts

	Wrapped in ServiceDevtoolShell (Status / Config / Logs / Actions /
	Debug). The devtool drives the `voice.tts` slot which loads the
	Qwen3-TTS-12Hz-0.6B safetensors talker + bundled codec via the
	model-loader's Candle backend.

	Voice routing follows the kernel convention parsed by
	`Qwen3TtsBackend::synthesize`:

	  - empty string or `"default"` — Qwen3-TTS default voice
	  - `qwen3:<speaker>`            — one of the 9 preset speakers
	  - `custom:<name>`              — a registered voice clone

	Cloned voices come from `assistant.toml` `voice_clones` and stay in
	sync with the live backend automatically (E3 refresh hook). The UI
	uploads an mp3, auto-fills the transcript via Whisper, then registers
	the clone — that triggers the engine refresh so the next preview can
	speak immediately.
-->
<script lang="ts">
import {
	Check,
	Edit3,
	Mic,
	Play,
	PowerOff,
	Star,
	Trash2,
	Upload,
	UserCircle,
	Volume2,
} from "lucide-svelte";
import { onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { VoiceInfo } from "$lib/devtools/_shared/voice-contracts.js";
import { voiceSelectionState } from "$lib/devtools/_shared/voice-selection.state.svelte.js";
import {
	type CapturePayload,
	type ExtraTab,
	type HealthBadge,
	ServiceDevtoolShell,
} from "$lib/devtools/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";
import { capabilityChannel } from "$lib/sys/events/index.js";
import {
	commands,
	type ScopedLogEntry,
	type VoiceCloneEntry,
} from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";
import { profilesState } from "../data-access/profiles.state.svelte.js";
import { listVoices, previewVoice, speak } from "../data-access/tts.svc.js";
import { ttsConfigState } from "../data-access/tts-config.state.svelte.js";

// ── Static catalog ─────────────────────────────────────
// The 9 preset speakers shipped with Qwen3-TTS-12Hz-0.6B-Base. The
// `id` value is what we suffix onto `qwen3:` when building the voice
// string passed to the backend; the rest is presentation-only.
const QWEN3_PRESETS: Array<{
	id: string;
	label: string;
	gender: "male" | "female";
	accent: string;
	blurb: string;
}> = [
	{
		id: "ryan",
		label: "Ryan",
		gender: "male",
		accent: "American",
		blurb: "Warm, mid-range — Clyffy default.",
	},
	{
		id: "aiden",
		label: "Aiden",
		gender: "male",
		accent: "American",
		blurb: "Bright, energetic narrator tone.",
	},
	{
		id: "eric",
		label: "Eric",
		gender: "male",
		accent: "American",
		blurb: "Deeper, calm broadcast voice.",
	},
	{
		id: "dylan",
		label: "Dylan",
		gender: "male",
		accent: "British",
		blurb: "Easy-going British male.",
	},
	{
		id: "unclefu",
		label: "Uncle Fu",
		gender: "male",
		accent: "Chinese",
		blurb: "Older, story-teller cadence.",
	},
	{
		id: "serena",
		label: "Serena",
		gender: "female",
		accent: "American",
		blurb: "Friendly, conversational.",
	},
	{
		id: "vivian",
		label: "Vivian",
		gender: "female",
		accent: "American",
		blurb: "Crisp, professional reader.",
	},
	{
		id: "onoanna",
		label: "Ono Anna",
		gender: "female",
		accent: "Japanese",
		blurb: "Soft Japanese-accented English.",
	},
	{
		id: "sohee",
		label: "Sohee",
		gender: "female",
		accent: "Korean",
		blurb: "Warm Korean-accented English.",
	},
];

const DEFAULT_TEST_TEXT = "Hello, I'm Clyffy. Welcome to DevPulse.";
const PREVIEW_TEXT = "Hi there. This is a preview of my voice.";

// ── Page-scoped state ──────────────────────────────────
let logs = $state<ScopedLogEntry[]>([]);
let logsLoading = $state(false);
let logsError = $state<string | null>(null);

let testText = $state(DEFAULT_TEST_TEXT);
let testSpeed = $state(1.0);
let speaking = $state(false);
let lastSpeakMs = $state<number | null>(null);
let loadingSlot = $state(false);
let error = $state<string | null>(null);

// Registry-driven voice list (Kokoro / non-Qwen3 voices, plus clones the
// engine surfaces). Loaded once `voice.tts` is ready; harvested from the
// retired wizard so devs can audition the full registry, not only the
// hardcoded Qwen3 presets.
let registryVoices = $state<VoiceInfo[]>([]);
let registryLoading = $state(false);
let registryError = $state<string | null>(null);
let registryFilter = $state<"all" | "female" | "male" | "neutral">("all");

const filteredRegistryVoices = $derived(
	registryFilter === "all"
		? registryVoices
		: registryVoices.filter((v) => v.gender === registryFilter),
);

// Active selection drives the Speak button. `mode` decides whether we
// dispatch to a preset or a clone; `id` is the entry id within that mode.
let mode = $state<"default" | "qwen3" | "custom">("qwen3");
let presetId = $state("ryan");
let cloneName = $state("");

// Voice-clone management state.
let clones = $state<VoiceCloneEntry[]>([]);
let clonesLoading = $state(false);
let clonesError = $state<string | null>(null);

let pendingClone = $state<{
	name: string;
	path: string;
	transcript: string;
} | null>(null);
let pickingFile = $state(false);
let registeringClone = $state(false);
let removingCloneName = $state<string | null>(null);

// ── Derived ────────────────────────────────────────────
// `current_runtime` is the live signal from the engine's capability
// event channel — set when the slot is loaded, null otherwise. We
// read readiness from here instead of `modelsState.statuses` so the
// voice domain doesn't depend on the model loader's internal state
// machine for the most-asked question ("is voice.tts alive?").
const ttsChannel = capabilityChannel("voice.tts");
const ttsReady = $derived(ttsChannel.ready);
// Slot metadata (label, assigned_model_id) is the model loader's
// published surface — fine to read directly. The forbidden pattern
// is only the inference-readiness lookup.
const ttsSlot = $derived(modelsState.slots.find((s) => s.id === "voice.tts"));

const activeVoice = $derived(buildVoiceString(mode, presetId, cloneName));

const badge = $derived<HealthBadge>(
	ttsReady
		? { state: "up", label: `Qwen3-TTS loaded · ${clones.length} cloned` }
		: ttsSlot?.assigned_model_id
			? { state: "stopped", label: "Model assigned — not loaded" }
			: { state: "unknown", label: "No model assigned" },
);

function buildVoiceString(
	m: "default" | "qwen3" | "custom",
	preset: string,
	clone: string,
): string {
	if (m === "default") return "";
	if (m === "qwen3") return `qwen3:${preset}`;
	return clone ? `custom:${clone}` : "";
}

// ── Lifecycle: prime config + clone list + profiles ───
// All three are mount-load only — bailouts (or function bodies) read
// loading flags that the load functions flip. (See ProjectSwitcher fix.)
onMount(() => {
	if (!ttsConfigState.config && !ttsConfigState.loading) {
		void ttsConfigState.load();
	}
	if (profilesState.profiles.length === 0 && !profilesState.loading) {
		void profilesState.load();
	}
	void loadClones();
});

// Watcher: refresh the registry voice list when the slot becomes ready.
// Reactive guard, not mount-load — `$effect` is correct here.
$effect(() => {
	if (ttsReady) {
		void loadRegistryVoices();
	}
});

async function loadRegistryVoices(): Promise<void> {
	registryLoading = true;
	registryError = null;
	try {
		registryVoices = await listVoices(voiceSelectionState.selectedTtsSlot);
		logInfo("devtools.tts", `Registry voices loaded: ${registryVoices.length}`);
	} catch (e) {
		registryError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `listVoices failed: ${registryError}`);
	} finally {
		registryLoading = false;
	}
}

async function previewRegistryVoice(voice: VoiceInfo): Promise<void> {
	voiceSelectionState.selectedVoice = voice.id;
	error = null;
	try {
		await previewVoice(voice.id, voiceSelectionState.selectedTtsSlot);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Preview registry voice failed: ${error}`);
	}
}

// ── Slot actions ───────────────────────────────────────
async function loadTts(): Promise<void> {
	loadingSlot = true;
	error = null;
	logInfo("devtools.tts", "Loading voice.tts slot");
	try {
		await modelsState.load("voice.tts");
		logInfo("devtools.tts", "voice.tts loaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `voice.tts load failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

async function unloadTts(): Promise<void> {
	loadingSlot = true;
	error = null;
	logInfo("devtools.tts", "Unloading voice.tts slot");
	try {
		await modelsState.unload("voice.tts");
		logInfo("devtools.tts", "voice.tts unloaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `voice.tts unload failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

// ── Synthesis ──────────────────────────────────────────
async function handleSpeak(): Promise<void> {
	if (!testText.trim()) return;
	speaking = true;
	lastSpeakMs = null;
	error = null;
	logInfo(
		"devtools.tts",
		`speak — voice=${activeVoice || "(default)"} speed=${testSpeed.toFixed(2)} text="${testText.slice(0, 50)}"`,
	);
	const start = performance.now();
	try {
		await speak(testText, activeVoice, "voice.tts", testSpeed);
		lastSpeakMs = Math.round(performance.now() - start);
		logInfo("devtools.tts", `speak complete (${lastSpeakMs}ms)`);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `speak failed: ${error}`);
	} finally {
		speaking = false;
	}
}

async function previewPreset(id: string): Promise<void> {
	const voice = `qwen3:${id}`;
	logInfo("devtools.tts", `Preview preset ${voice}`);
	error = null;
	try {
		await speak(PREVIEW_TEXT, voice, "voice.tts");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Preview failed: ${error}`);
	}
}

async function previewClone(name: string): Promise<void> {
	const voice = `custom:${name}`;
	logInfo("devtools.tts", `Preview clone ${voice}`);
	error = null;
	try {
		await speak(PREVIEW_TEXT, voice, "voice.tts");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Preview failed: ${error}`);
	}
}

// ── Clone management ───────────────────────────────────
async function loadClones(): Promise<void> {
	clonesLoading = true;
	clonesError = null;
	try {
		const r = await commands.getAssistantConfig();
		if (r.status === "error") throw new Error(r.error);
		clones = r.data.voice_clones ?? [];
	} catch (e) {
		clonesError = e instanceof Error ? e.message : String(e);
	} finally {
		clonesLoading = false;
	}
}

async function pickAndUploadSample(): Promise<void> {
	pickingFile = true;
	clonesError = null;
	try {
		const picked = await commands.pickAudioFile("Choose a voice reference clip");
		if (picked.status === "error") throw new Error(picked.error);
		const path = picked.data;
		if (!path) {
			pickingFile = false;
			return;
		}
		const baseName =
			path
				.split(/[\\/]/)
				.pop()
				?.replace(/\.[^.]+$/, "")
				?.replace(/[^a-zA-Z0-9_-]/g, "") ?? "clone";
		const upload = await commands.uploadVoiceSample(baseName, path);
		if (upload.status === "error") throw new Error(upload.error);
		pendingClone = {
			name: baseName,
			path: upload.data.path,
			transcript: upload.data.suggested_transcript,
		};
		logInfo(
			"devtools.tts",
			`Uploaded ${baseName} (${upload.data.suggested_transcript.length} char transcript)`,
		);
	} catch (e) {
		clonesError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Upload failed: ${clonesError}`);
	} finally {
		pickingFile = false;
	}
}

async function registerPendingClone(): Promise<void> {
	if (!pendingClone) return;
	registeringClone = true;
	clonesError = null;
	try {
		const safe = pendingClone.name.trim().replace(/[^a-zA-Z0-9_-]/g, "");
		if (!safe) {
			clonesError = "Clone name must contain at least one letter, digit, dash, or underscore.";
			registeringClone = false;
			return;
		}
		const r = await commands.registerVoiceClone({
			name: safe,
			reference_path: pendingClone.path,
			transcript: pendingClone.transcript,
		});
		if (r.status === "error") throw new Error(r.error);
		logInfo("devtools.tts", `Registered clone '${safe}'`);
		pendingClone = null;
		await loadClones();
		mode = "custom";
		cloneName = safe;
	} catch (e) {
		clonesError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Register failed: ${clonesError}`);
	} finally {
		registeringClone = false;
	}
}

function cancelPendingClone(): void {
	pendingClone = null;
}

async function removeClone(name: string): Promise<void> {
	removingCloneName = name;
	clonesError = null;
	try {
		const r = await commands.removeVoiceClone(name);
		if (r.status === "error") throw new Error(r.error);
		logInfo("devtools.tts", `Removed clone '${name}'`);
		if (cloneName === name) {
			cloneName = "";
			mode = "qwen3";
		}
		await loadClones();
	} catch (e) {
		clonesError = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Remove failed: ${clonesError}`);
	} finally {
		removingCloneName = null;
	}
}

// ── Logs ───────────────────────────────────────────────
async function loadLogs(): Promise<void> {
	logsLoading = true;
	logsError = null;
	try {
		const r = await commands.queryScopedLog("devtools.tts", 100);
		if (r.status === "error") throw new Error(r.error);
		logs = r.data;
	} catch (e) {
		logsError = e instanceof Error ? e.message : String(e);
	} finally {
		logsLoading = false;
	}
}

// ── Per-tab Copy/Export payloads ───────────────────────
function capture(tabId: string): CapturePayload | undefined {
	if (tabId === "status") {
		return {
			filename: "tts-status.json",
			mime: "application/json",
			content: JSON.stringify(
				{
					slot: ttsSlot,
					ready: ttsReady,
					active_voice: activeVoice || "(default)",
					clone_count: clones.length,
					last_speak_ms: lastSpeakMs,
					test_speed: testSpeed,
					active_profile: profilesState.active?.id ?? null,
				},
				null,
				2,
			),
		};
	}
	if (tabId === "config") {
		return ttsConfigState.config
			? {
					filename: "voice-tts.toml.json",
					mime: "application/json",
					content: JSON.stringify(ttsConfigState.config, null, 2),
				}
			: undefined;
	}
	if (tabId === "logs") {
		return logs.length > 0
			? {
					filename: "tts-logs.txt",
					mime: "text/plain",
					content: logs.map((l) => `[${l.timestamp}] ${l.level} ${l.message}`).join("\n"),
				}
			: undefined;
	}
	if (tabId === "debug") {
		return {
			filename: "tts-debug.json",
			mime: "application/json",
			content: JSON.stringify({ clones, presets: QWEN3_PRESETS }, null, 2),
		};
	}
	if (tabId === "profiles") {
		return profilesState.profiles.length > 0
			? {
					filename: "voice-profiles.json",
					mime: "application/json",
					content: JSON.stringify(profilesState.profiles, null, 2),
				}
			: undefined;
	}
	return undefined;
}

const extraTabs: ExtraTab[] = [{ id: "profiles", label: "Profiles", Icon: UserCircle }];
</script>

<ServiceDevtoolShell
	title="Voice Synthesis"
	description="Qwen3-TTS — preset speakers + zero-shot voice cloning"
	icon={Volume2}
	axis="capabilities"
	accent="magenta"
	health={badge}
	{capture}
	{extraTabs}
>
	{#snippet status()}
		<div class="flex flex-col gap-3">
			<div class="flex items-center gap-3">
				<Text size="sm" weight="bold">voice.tts</Text>
				{#if ttsReady}
					<Badge tone="positive" size="sm">
						<Check size={8} />
						Ready
					</Badge>
				{:else if ttsSlot?.assigned_model_id}
					<Badge tone="neutral" size="sm">Assigned</Badge>
				{:else}
					<Badge tone="neutral" size="sm">Empty</Badge>
				{/if}
			</div>

			{#if ttsSlot?.assigned_model_id}
				<Text size="xs" color="muted">
					Assigned model: <span class="font-mono">{ttsSlot.assigned_model_id}</span>
				</Text>
			{:else}
				<Text size="xs" color="muted">
					No model assigned. Open the model loader and assign a Qwen3-TTS
					build to <span class="font-mono">voice.tts</span>.
				</Text>
			{/if}

			<div
				class="rounded-lg p-3"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<Text size="xs" weight="bold">Active voice</Text>
				<Text size="xs" color="muted">
					{activeVoice || "(default Qwen3-TTS voice)"}
				</Text>
			</div>

			<div
				class="rounded-lg p-3"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<Text size="xs" weight="bold">Voice clones</Text>
				<Text size="xs" color="muted">
					{clones.length} registered · {QWEN3_PRESETS.length} presets available
				</Text>
			</div>

			{#if lastSpeakMs !== null}
				<div
					class="rounded-lg p-3"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<Text size="xs" weight="bold">Last speak latency</Text>
					<Text size="xs" color="muted">
						<span class="font-mono">{lastSpeakMs}ms</span>
						{#if testSpeed !== 1.0}
							· override speed
							<span class="font-mono">{testSpeed.toFixed(2)}×</span>
						{/if}
					</Text>
				</div>
			{/if}

			{#if profilesState.active}
				<div
					class="rounded-lg p-3"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<Text size="xs" weight="bold">Active profile</Text>
					<Text size="xs" color="muted">
						<span class="font-mono">{profilesState.active.name}</span>
						· voice
						<span class="font-mono">{profilesState.active.tts_voice_id}</span>
						· STT
						<span class="font-mono">{profilesState.active.stt_quality}</span>
					</Text>
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
		<div class="space-y-4">
			{#if ttsConfigState.loading && !ttsConfigState.config}
				<Text size="sm" color="muted">Loading TTS config…</Text>
			{/if}

			{#if ttsConfigState.error}
				<div
					role="alert"
					aria-live="assertive"
					class="p-3 rounded-lg text-xs"
					style="background: color-mix(in oklch, var(--signal-error) 12%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 40%, transparent); color: var(--signal-error);"
				>
					{ttsConfigState.error}
				</div>
			{/if}

			{#if ttsConfigState.config}
				<div class="space-y-3">
					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">Default voice</Text>
						<input
							type="text"
							bind:value={ttsConfigState.draft.default_voice}
							placeholder="qwen3:ryan"
							class="w-full rounded px-2 py-1 text-xs font-mono outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						/>
						<Text size="xs" color="muted">
							Empty = Qwen3 default. Use
							<span class="font-mono">qwen3:&lt;preset&gt;</span> or
							<span class="font-mono">custom:&lt;clone&gt;</span>.
						</Text>
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
							class="w-full"
							style="accent-color: var(--accent-service-main);"
						/>
					</div>

					<div class="flex items-center gap-2 pt-2">
						<Button
							preset="button-primary"
							size="sm"
							onclick={() => void ttsConfigState.save()}
							disabled={ttsConfigState.saving || !ttsConfigState.dirty}
						>
							{#if ttsConfigState.saving}
								<Spinner size="xs" />
								Saving…
							{:else}
								Save
							{/if}
						</Button>
						<Button
							preset="button-ghost"
							size="sm"
							onclick={() => ttsConfigState.reset()}
							disabled={!ttsConfigState.dirty || ttsConfigState.saving}
						>
							Discard
						</Button>
						{#if ttsConfigState.dirty}
							<Text size="xs" color="muted">Unsaved changes</Text>
						{/if}
					</div>

					<Text size="xs" color="muted">
						Persisted in <span class="font-mono text-[10px]">user/voice_tts.toml</span>.
						Speed is clamped to <span class="font-mono">[0.5, 2.0]</span>.
					</Text>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<div class="space-y-3">
			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">
					Scoped log — <span class="font-mono text-xs">devtools.tts</span>
				</Text>
				<Button preset="ghost" size="sm" onclick={loadLogs} disabled={logsLoading}>
					{#if logsLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						Refresh
					{/if}
				</Button>
			</div>

			{#if logsError}
				<div
					role="alert"
					aria-live="assertive"
					class="p-3 rounded-lg text-xs"
					style="background: color-mix(in oklch, var(--signal-error) 12%, transparent); border: 1px solid color-mix(in oklch, var(--signal-error) 40%, transparent); color: var(--signal-error);"
				>
					{logsError}
				</div>
			{/if}

			{#if logs.length > 0}
				<div
					class="rounded-lg border border-[var(--border-subtle)] overflow-hidden max-h-80 overflow-y-auto"
				>
					<table class="w-full text-xs">
						<thead class="sticky top-0 bg-[var(--surface-raised)]">
							<tr class="border-b border-[var(--border-subtle)]">
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Time</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Level</th>
								<th class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]">Message</th>
							</tr>
						</thead>
						<tbody>
							{#each logs as line (line.timestamp + line.message)}
								<tr class="border-b border-[var(--border-subtle)]">
									<td class="px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]">
										{line.timestamp.slice(11, 19)}
									</td>
									<td class="px-2 py-1 font-mono text-[10px]">{line.level}</td>
									<td class="px-2 py-1 break-all">{line.message}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else if logsLoading}
				<Text size="sm" color="muted">Loading…</Text>
			{:else}
				<Text size="sm" color="muted">
					No log entries yet — click Refresh to tail the current session log.
				</Text>
			{/if}
		</div>
	{/snippet}

	{#snippet actions()}
		{#if loadingSlot}
			<LoadingBlock
				title="Loading Qwen3-TTS"
				subtitle="Talker LM + neural codec into RAM / VRAM — sit tight."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-5">
				<!-- Slot load / unload -->
				<div class="flex flex-wrap items-center gap-2">
					{#if !ttsReady && ttsSlot?.assigned_model_id}
						<Button preset="button-primary" size="sm" onclick={loadTts}>
							<Play size={12} />
							Load Qwen3-TTS
						</Button>
					{/if}
					{#if ttsReady}
						<Button preset="button-ghost" size="sm" onclick={unloadTts}>
							<PowerOff size={12} />
							Unload
						</Button>
					{/if}
					{#if !ttsSlot?.assigned_model_id}
						<Text size="xs" color="muted">
							Assign a Qwen3-TTS model in the model loader first.
						</Text>
					{/if}
				</div>

				{#if ttsReady}
					<!-- Voice mode + selection -->
					<div class="flex flex-col gap-3">
						<Text size="sm" weight="bold">Voice mode</Text>
						<div class="flex flex-wrap gap-2">
							<Button
								preset={mode === "default" ? "button-primary" : "button-ghost"}
								size="sm"
								onclick={() => {
									mode = "default";
								}}
							>
								Default
							</Button>
							<Button
								preset={mode === "qwen3" ? "button-primary" : "button-ghost"}
								size="sm"
								onclick={() => {
									mode = "qwen3";
								}}
							>
								Preset speaker
							</Button>
							<Button
								preset={mode === "custom" ? "button-primary" : "button-ghost"}
								size="sm"
								onclick={() => {
									mode = "custom";
								}}
								disabled={clones.length === 0}
							>
								Cloned voice
							</Button>
						</div>
					</div>

					{#if mode === "qwen3"}
						<div class="flex flex-col gap-2">
							<Text size="sm" weight="bold">Preset speakers</Text>
							<div
								class="grid gap-2"
								style="grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));"
							>
								{#each QWEN3_PRESETS as p (p.id)}
									<button
										type="button"
										aria-pressed={presetId === p.id}
										aria-label={`Select Qwen3 preset ${p.label} — ${p.gender} ${p.accent}. Double-click to preview.`}
										class="flex flex-col items-start gap-0.5 rounded-lg p-3 text-left transition-colors"
										style={presetId === p.id
											? "background: var(--accent-service-fill); border: 1px solid var(--accent-service-main);"
											: "background: var(--surface-base); border: 1px solid var(--border-subtle);"}
										onclick={() => {
											presetId = p.id;
										}}
										ondblclick={() => previewPreset(p.id)}
										title="Double-click to preview"
									>
										<Text size="sm" weight="bold">{p.label}</Text>
										<Text size="xs" color="muted">{p.gender} · {p.accent}</Text>
										<Text size="xs" color="muted">{p.blurb}</Text>
									</button>
								{/each}
							</div>
							<Text size="xs" color="muted">
								Double-click a card to preview. Click to select.
							</Text>
						</div>
					{/if}

					{#if mode === "custom"}
						<div class="flex flex-col gap-2">
							<Text size="sm" weight="bold">Cloned voices</Text>
							{#if clones.length === 0}
								<Text size="xs" color="muted">
									No clones registered. Use the section below to upload a
									reference clip.
								</Text>
							{:else}
								<div
									class="grid gap-2"
									style="grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));"
								>
									{#each clones as c (c.name)}
										<button
											type="button"
											aria-pressed={cloneName === c.name}
											aria-label={`Select cloned voice ${c.name}. Double-click to preview.`}
											class="flex flex-col items-start gap-0.5 rounded-lg p-3 text-left transition-colors"
											style={cloneName === c.name
												? "background: var(--accent-service-fill); border: 1px solid var(--accent-service-main);"
												: "background: var(--surface-base); border: 1px solid var(--border-subtle);"}
											onclick={() => {
												cloneName = c.name;
											}}
											ondblclick={() => previewClone(c.name)}
											title="Double-click to preview"
										>
											<Text size="sm" weight="bold">{c.name}</Text>
											<Text size="xs" color="muted">
												{c.transcript ? `“${c.transcript.slice(0, 40)}${c.transcript.length > 40 ? "…" : ""}”` : "(no transcript)"}
											</Text>
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Registry voices (non-Qwen3 / Kokoro / engine-reported) -->
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between">
							<Text size="sm" weight="bold">
								Registry voices
								{#if registryVoices.length > 0}
									<span class="font-mono text-xs" style="color: var(--text-secondary);">
										({filteredRegistryVoices.length} / {registryVoices.length})
									</span>
								{/if}
							</Text>
							<select
								bind:value={registryFilter}
								aria-label="Filter registry voices by gender"
								class="rounded px-2 py-1 text-xs outline-none"
								style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
							>
								<option value="all">All</option>
								<option value="female">Female</option>
								<option value="male">Male</option>
								<option value="neutral">Neutral</option>
							</select>
						</div>

						{#if registryError}
							<div
								role="alert"
								aria-live="assertive"
								class="rounded-lg p-2 text-xs"
								style="background: color-mix(in oklch, var(--signal-error) 18%, transparent); border: 1px solid var(--signal-error);"
							>
								Registry load failed: {registryError}
							</div>
						{:else if registryLoading}
							<Text size="xs" color="muted">Loading registry…</Text>
						{:else if registryVoices.length === 0}
							<Text size="xs" color="muted">
								No registry voices reported by the active TTS slot.
							</Text>
						{:else}
							<div
								class="grid gap-2"
								style="grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));"
							>
								{#each filteredRegistryVoices as voice (voice.id)}
									<button
										type="button"
										aria-pressed={voiceSelectionState.selectedVoice === voice.id}
										aria-label={`Preview ${voice.label} — ${voice.gender}, ${voice.language}, ${voice.engine}.`}
										class="flex flex-col items-start gap-0.5 rounded-lg p-3 text-left transition-colors"
										style={voiceSelectionState.selectedVoice === voice.id
											? "background: var(--accent-service-fill); border: 1px solid var(--accent-service-main);"
											: "background: var(--surface-base); border: 1px solid var(--border-subtle);"}
										onclick={() => previewRegistryVoice(voice)}
										title={voice.description}
									>
										<Text size="sm" weight="bold">{voice.label}</Text>
										<Text size="xs" color="muted">
											{voice.gender} · {voice.language} · {voice.engine}
										</Text>
										<Text size="xs" color="muted" class="truncate">
											{voice.description}
										</Text>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Speak test -->
					<div class="flex flex-col gap-2">
						<Text size="sm" weight="bold">Test synthesis</Text>
						<textarea
							bind:value={testText}
							rows={3}
							placeholder="Type text for Clyffy to speak…"
							class="w-full rounded-lg p-3 text-sm resize-none outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						></textarea>
						<div class="flex items-center gap-3">
							<Text size="xs" color="muted" class="w-16">
								Speed · {testSpeed.toFixed(2)}×
							</Text>
							<input
								type="range"
								min="0.5"
								max="2.0"
								step="0.05"
								bind:value={testSpeed}
								aria-label="Per-test TTS speech speed override (0.5× to 2.0×)"
								aria-valuetext={`${testSpeed.toFixed(2)}×`}
								class="flex-1 max-w-80"
								style="accent-color: var(--accent-service-main);"
							/>
							<Button
								preset="button-ghost"
								size="sm"
								onclick={() => {
									testSpeed = 1.0;
								}}
								disabled={testSpeed === 1.0}
							>
								Reset
							</Button>
						</div>
						<Button
							preset="button-primary"
							size="md"
							onclick={handleSpeak}
							disabled={speaking || !testText.trim() || (mode === "custom" && !cloneName)}
						>
							{#if speaking}
								<Spinner size="xs" />
								Speaking…
							{:else}
								<Volume2 size={16} />
								Speak as {activeVoice || "default"}
							{/if}
						</Button>
					</div>

					<!-- Clone management -->
					<div
						class="flex flex-col gap-3 rounded-lg p-3"
						style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
					>
						<div class="flex items-center justify-between gap-2">
							<Text size="sm" weight="bold">Voice cloning</Text>
							<Button
								preset="button-primary"
								size="sm"
								onclick={pickAndUploadSample}
								disabled={pickingFile || pendingClone !== null}
							>
								{#if pickingFile}
									<Spinner size="xs" />
									Uploading…
								{:else}
									<Upload size={12} />
									Upload reference
								{/if}
							</Button>
						</div>

						{#if clonesError}
							<div
								role="alert"
								aria-live="assertive"
								class="rounded-lg p-2 text-xs"
								style="background: color-mix(in oklch, var(--signal-error) 18%, transparent); border: 1px solid var(--signal-error);"
							>
								{clonesError}
							</div>
						{/if}

						{#if pendingClone}
							<div
								class="flex flex-col gap-2 rounded-lg p-3"
								style="background: var(--surface-raised); border: 1px solid var(--accent-service-main);"
							>
								<div class="flex items-center gap-2">
									<Mic size={12} />
									<Text size="xs" weight="bold">
										New clone — review &amp; register
									</Text>
								</div>

								<div class="flex flex-col gap-1">
									<Text size="xs" color="muted">Name</Text>
									<input
										type="text"
										bind:value={pendingClone.name}
										class="rounded px-2 py-1 text-xs font-mono outline-none"
										style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
									/>
								</div>

								<div class="flex flex-col gap-1">
									<Text size="xs" color="muted">
										Reference path (read-only)
									</Text>
									<Text size="xs" color="muted">
										<span class="font-mono break-all">{pendingClone.path}</span>
									</Text>
								</div>

								<div class="flex flex-col gap-1">
									<Text size="xs" color="muted">
										Transcript {pendingClone.transcript === ""
											? "(STT not loaded — fill manually)"
											: "(auto-filled — edit if needed)"}
									</Text>
									<textarea
										bind:value={pendingClone.transcript}
										rows={2}
										class="w-full rounded-lg p-2 text-xs resize-none outline-none"
										style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
									></textarea>
								</div>

								<div class="flex items-center gap-2">
									<Button
										preset="button-primary"
										size="sm"
										onclick={registerPendingClone}
										disabled={registeringClone || !pendingClone.name.trim()}
									>
										{#if registeringClone}
											<Spinner size="xs" />
											Registering…
										{:else}
											<Check size={12} />
											Register clone
										{/if}
									</Button>
									<Button
										preset="button-ghost"
										size="sm"
										onclick={cancelPendingClone}
										disabled={registeringClone}
									>
										Cancel
									</Button>
								</div>
							</div>
						{/if}

						{#if clones.length > 0}
							<div class="flex flex-col gap-2">
								<Text size="xs" weight="bold" color="muted">Registered</Text>
								{#each clones as c (c.name)}
									<div
										class="flex items-center justify-between gap-2 rounded-lg p-2"
										style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
									>
										<div class="flex flex-col">
											<Text size="xs" weight="bold">{c.name}</Text>
											<Text size="xs" color="muted">
												<span class="font-mono break-all">{c.reference_path}</span>
											</Text>
										</div>
										<div class="flex items-center gap-1">
											<Button
												preset="button-ghost"
												size="sm"
												aria-label={`Preview clone ${c.name}`}
												onclick={() => previewClone(c.name)}
											>
												<Play size={12} />
											</Button>
											<Button
												preset="button-ghost"
												size="sm"
												aria-label={`Delete clone ${c.name}`}
												aria-busy={removingCloneName === c.name}
												onclick={() => removeClone(c.name)}
												disabled={removingCloneName === c.name}
											>
												{#if removingCloneName === c.name}
													<Spinner size="xs" />
												{:else}
													<Trash2 size={12} />
												{/if}
											</Button>
										</div>
									</div>
								{/each}
							</div>
						{:else if !clonesLoading && !pendingClone}
							<Text size="xs" color="muted">
								No clones yet. Upload a 5–15s reference clip to clone a voice.
							</Text>
						{/if}
					</div>
				{:else}
					<Text size="sm" color="muted">
						Load Qwen3-TTS to unlock the voice picker, cloning, and
						synthesis controls.
					</Text>
				{/if}
			</div>
		{/if}
	{/snippet}

	{#snippet debug()}
		<div class="flex flex-col gap-4">
			<div
				class="rounded-lg p-3"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<Text size="sm" weight="bold">Voice routing convention</Text>
				<ul class="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
					<li>
						<span class="font-mono">""</span> /
						<span class="font-mono">"default"</span> — Qwen3-TTS default voice
					</li>
					<li>
						<span class="font-mono">"qwen3:&lt;speaker&gt;"</span> — preset
						(ryan, serena, vivian, unclefu, aiden, onoanna, sohee, eric, dylan)
					</li>
					<li>
						<span class="font-mono">"custom:&lt;name&gt;"</span> — registered
						voice clone (must exist in
						<span class="font-mono">assistant.toml</span>)
					</li>
				</ul>
			</div>

			<div
				class="rounded-lg p-3"
				style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
			>
				<div class="flex items-center justify-between gap-2">
					<Text size="sm" weight="bold">
						voice_clones (live snapshot · {clones.length})
					</Text>
					<Button
						preset="button-ghost"
						size="sm"
						onclick={loadClones}
						disabled={clonesLoading}
					>
						{#if clonesLoading}
							<Spinner size="xs" />
						{:else}
							Refresh
						{/if}
					</Button>
				</div>
				<pre
					class="mt-2 max-h-64 overflow-auto rounded p-2 text-[10px] font-mono"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);">{JSON.stringify(clones, null, 2)}</pre>
			</div>

			<Text size="xs" color="muted">
				Snapshot is pushed into the live backend on every
				register / remove and on every TTS slot load (engine
				refresh hook). Stale data here means the lock is
				poisoned — restart the app.
			</Text>
		</div>
	{/snippet}

	{#snippet extra(tabId: string)}
		{#if tabId === "profiles"}
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<Text size="sm" weight="bold">Voice profiles</Text>
					<div class="flex items-center gap-2">
						<Button
							preset="button-ghost"
							size="sm"
							onclick={() => void profilesState.load()}
							disabled={profilesState.loading}
						>
							{#if profilesState.loading}
								<Spinner size="xs" />
							{:else}
								Refresh
							{/if}
						</Button>
						<Button
							preset="button-primary"
							size="sm"
							onclick={() => profilesState.startNew(voiceSelectionState.selectedVoice)}
							disabled={profilesState.draft !== null || profilesState.mutating}
						>
							<Play size={12} />
							New profile
						</Button>
					</div>
				</div>

				{#if profilesState.error}
					<div
						role="alert"
						aria-live="assertive"
						class="rounded-lg p-3"
						style="background: color-mix(in oklch, var(--signal-error) 18%, transparent); border: 1px solid var(--signal-error);"
					>
						<Text size="xs">{profilesState.error}</Text>
					</div>
				{/if}

				{#if profilesState.draft}
					<div
						class="flex flex-col gap-3 rounded-lg p-4"
						style="background: var(--surface-base); border: 1px solid var(--accent-service-main);"
					>
						<Text size="sm" weight="bold">
							{profilesState.profiles.some((p) => p.id === profilesState.draft?.id)
								? "Edit profile"
								: "New profile"}
						</Text>

						<div class="flex flex-col gap-1">
							<Text size="xs" color="muted">Display name</Text>
							<input
								type="text"
								bind:value={profilesState.draft.name}
								placeholder="Clyffy default"
								class="rounded px-2 py-1 text-xs outline-none"
								style="background: var(--surface-raised); border: 1px solid var(--border-subtle); color: var(--text-primary);"
							/>
						</div>

						<div class="flex flex-col gap-1">
							<Text size="xs" color="muted">TTS voice id</Text>
							<input
								type="text"
								bind:value={profilesState.draft.tts_voice_id}
								placeholder="qwen3:ryan"
								class="rounded px-2 py-1 text-xs font-mono outline-none"
								style="background: var(--surface-raised); border: 1px solid var(--border-subtle); color: var(--text-primary);"
							/>
							<Text size="xs" color="muted">
								Empty = default. Use
								<span class="font-mono">qwen3:&lt;preset&gt;</span> or
								<span class="font-mono">custom:&lt;clone&gt;</span>.
							</Text>
						</div>

						<div class="flex flex-col gap-1">
							<Text size="xs" color="muted">STT quality</Text>
							<select
								bind:value={profilesState.draft.stt_quality}
								class="rounded px-2 py-1 text-xs outline-none"
								style="background: var(--surface-raised); border: 1px solid var(--border-subtle); color: var(--text-primary);"
							>
								<option value="standard">standard</option>
								<option value="high_quality">high_quality</option>
								<option value="best">best</option>
							</select>
						</div>

						<div class="flex items-center gap-2">
							<Button
								preset="button-primary"
								size="sm"
								onclick={() => void profilesState.commitDraft()}
								disabled={profilesState.mutating || !profilesState.draft.name.trim()}
							>
								{#if profilesState.mutating}
									<Spinner size="xs" />
									Saving…
								{:else}
									<Check size={12} />
									Save
								{/if}
							</Button>
							<Button
								preset="button-ghost"
								size="sm"
								onclick={() => profilesState.cancelDraft()}
								disabled={profilesState.mutating}
							>
								Cancel
							</Button>
						</div>
					</div>
				{/if}

				{#if profilesState.profiles.length === 0 && !profilesState.loading}
					<Text size="xs" color="muted">
						No profiles registered. Click "New profile" to capture the
						current voice id and STT quality as a named preset.
					</Text>
				{:else}
					<div class="flex flex-col gap-2">
						{#each profilesState.profiles as p (p.id)}
							<div
								class="flex items-center justify-between gap-2 rounded-lg p-3"
								style={p.active
									? "background: var(--accent-service-fill); border: 1px solid var(--accent-service-main);"
									: "background: var(--surface-base); border: 1px solid var(--border-subtle);"}
							>
								<div class="flex flex-col gap-0.5">
									<div class="flex items-center gap-2">
										{#if p.active}
											<Star size={12} style="color: var(--accent-service-main);" />
										{/if}
										<Text size="sm" weight="bold">{p.name || "(unnamed)"}</Text>
									</div>
									<Text size="xs" color="muted">
										voice <span class="font-mono">{p.tts_voice_id || "(default)"}</span>
										· STT <span class="font-mono">{p.stt_quality}</span>
									</Text>
								</div>
								<div class="flex items-center gap-1">
									{#if !p.active}
										<Button
											preset="button-ghost"
											size="sm"
											aria-label={`Activate profile ${p.name || "(unnamed)"}`}
											onclick={() => void profilesState.activate(p.id)}
											disabled={profilesState.mutating}
										>
											Activate
										</Button>
									{/if}
									<Button
										preset="button-ghost"
										size="sm"
										aria-label={`Edit profile ${p.name || "(unnamed)"}`}
										onclick={() => profilesState.startEdit(p.id)}
										disabled={profilesState.mutating || profilesState.draft !== null}
									>
										<Edit3 size={12} />
									</Button>
									{#if p.id !== "default"}
										<Button
											preset="button-ghost"
											size="sm"
											aria-label={`Delete profile ${p.name || "(unnamed)"}`}
											onclick={() => void profilesState.remove(p.id)}
											disabled={profilesState.mutating}
										>
											<Trash2 size={12} />
										</Button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
