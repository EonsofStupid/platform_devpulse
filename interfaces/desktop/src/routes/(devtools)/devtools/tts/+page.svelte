<!--
	@file /devtools/tts — Text-to-Speech devtool
	@route /devtools/tts

	Wrapped in ServiceDevtoolShell (Status/Config/Logs/Actions). Slot
	load/unload presents the Clyffy LoadingBlock (rotating DYK card).
	Short actions (Speak, Preview) use inline spinner.

	Preserved features: voice picker grid, speed control, speak test,
	per-voice preview, voice-cloning future note.
-->
<script lang="ts">
import { Check, Play, PowerOff, Volume2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { LoadingBlock, Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import {
	listVoices,
	previewVoice,
	speak,
	voiceTtsConfigState,
} from "$lib/domains/app/voice/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";
import type { ScopedLogEntry } from "$lib/sys/generated/bindings.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

// ── Config + logs state (scoped to this page) ─────────────
let logs = $state<ScopedLogEntry[]>([]);
let logsLoading = $state(false);
let logsError = $state<string | null>(null);

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

// Prime config on mount.
$effect(() => {
	if (!voiceTtsConfigState.config && !voiceTtsConfigState.loading) {
		void voiceTtsConfigState.load();
	}
});

// ── State ──────────────────────────────────────────────
let voices = $state<
	Array<{ id: string; label: string; gender: string; style: string; description: string }>
>([]);
let selectedVoice = $state("af_heart");
let speed = $state(1.0);
let testText = $state("Hello, I'm Clyffy. Welcome to DevPulse.");
let speaking = $state(false);
let loadingSlot = $state(false);
let voicesLoaded = $state(false);
let error = $state<string | null>(null);

// ── Derived ────────────────────────────────────────────
const ttsStatus = $derived(modelsState.statuses["voice.tts"]);
const ttsReady = $derived(ttsStatus ? isInferenceReady(ttsStatus) : false);
const ttsSlot = $derived(modelsState.slots.find((s) => s.id === "voice.tts"));

const badge = $derived<HealthBadge>(
	ttsReady
		? { state: "up", label: `Kokoro loaded · ${voices.length} voices` }
		: ttsSlot?.assigned_model_id
			? { state: "stopped", label: "Model assigned — not loaded" }
			: { state: "unknown", label: "No model assigned" },
);

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
		voices = [];
		voicesLoaded = false;
		logInfo("devtools.tts", "voice.tts unloaded");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `voice.tts unload failed: ${error}`);
	} finally {
		loadingSlot = false;
	}
}

// ── Voice catalog + synthesis ──────────────────────────
async function fetchVoices(): Promise<void> {
	try {
		const result = await listVoices("voice.tts");
		voices = result;
		voicesLoaded = true;
		logInfo("devtools.tts", `Loaded ${result.length} voices`);
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `listVoices failed: ${error}`);
	}
}

async function handlePreview(voiceId: string): Promise<void> {
	logInfo("devtools.tts", `Preview voice: ${voiceId}`);
	error = null;
	try {
		await previewVoice(voiceId, "voice.tts");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `Preview failed: ${error}`);
	}
}

async function handleSpeak(): Promise<void> {
	if (!testText.trim()) return;
	speaking = true;
	error = null;
	logInfo(
		"devtools.tts",
		`speak() — voice=${selectedVoice} speed=${speed} text="${testText.slice(0, 50)}"`,
	);
	try {
		await speak(testText, selectedVoice, "voice.tts", speed);
		logInfo("devtools.tts", "speak() complete");
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
		logInfo("devtools.tts", `speak() failed: ${error}`);
	} finally {
		speaking = false;
	}
}

$effect(() => {
	if (ttsReady && !voicesLoaded) {
		void fetchVoices();
	}
});
</script>

<ServiceDevtoolShell
	title="Text-to-Speech"
	description="Kokoro — voice synthesis"
	icon={Volume2}
	axis="capabilities"
	accent="magenta"
	health={badge}
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
					Assigned model id: <span class="font-mono">{ttsSlot.assigned_model_id}</span>
				</Text>
			{:else}
				<Text size="xs" color="muted">
					No model assigned. Use the setup wizard's Voice card to pick a
					Kokoro build for this slot.
				</Text>
			{/if}

			{#if ttsReady}
				<div class="rounded-lg p-3" style="background: var(--surface-base); border: 1px solid var(--border-subtle);">
					<Text size="xs" weight="bold">Catalog</Text>
					<Text size="xs" color="muted">
						{voices.length} voices available · current selection:
						<span class="font-mono">{selectedVoice}</span> · speed {speed.toFixed(1)}×
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
			{#if voiceTtsConfigState.loading && !voiceTtsConfigState.config}
				<Text size="sm" color="muted">Loading TTS config…</Text>
			{/if}

			{#if voiceTtsConfigState.error}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{voiceTtsConfigState.error}
				</div>
			{/if}

			{#if voiceTtsConfigState.config}
				<div class="space-y-3">
					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">Default voice</Text>
						<input
							type="text"
							bind:value={voiceTtsConfigState.draft.default_voice}
							placeholder="af_heart"
							class="w-full rounded px-2 py-1 text-xs font-mono outline-none"
							style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-primary);"
						/>
					</div>

					<div class="space-y-2">
						<Text size="xs" weight="bold" color="muted">
							Default speed · {voiceTtsConfigState.draft.default_speed.toFixed(2)}×
						</Text>
						<input
							type="range"
							min="0.5"
							max="2.0"
							step="0.05"
							bind:value={voiceTtsConfigState.draft.default_speed}
							class="w-full"
							style="accent-color: var(--accent-teal-main);"
						/>
					</div>

					<div class="flex items-center gap-2 pt-2">
						<Button
							preset="button-primary"
							size="sm"
							onclick={() => void voiceTtsConfigState.save()}
							disabled={voiceTtsConfigState.saving || !voiceTtsConfigState.dirty}
						>
							{#if voiceTtsConfigState.saving}
								<Spinner size="xs" />
								Saving…
							{:else}
								Save
							{/if}
						</Button>
						<Button
							preset="button-ghost"
							size="sm"
							onclick={() => voiceTtsConfigState.reset()}
							disabled={!voiceTtsConfigState.dirty || voiceTtsConfigState.saving}
						>
							Discard
						</Button>
						{#if voiceTtsConfigState.dirty}
							<Text size="xs" color="muted">Unsaved changes</Text>
						{/if}
					</div>

					<Text size="xs" color="muted">
						Speed is clamped to <span class="font-mono">[0.5, 2.0]</span>.
						Empty voice reverts to <span class="font-mono">af_heart</span>.
						Persisted in <span class="font-mono text-[10px]">user/voice_tts.toml</span>.
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
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
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
								<th
									class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]"
									>Time</th
								>
								<th
									class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]"
									>Level</th
								>
								<th
									class="text-left px-2 py-1 font-medium text-[var(--text-secondary)]"
									>Message</th
								>
							</tr>
						</thead>
						<tbody>
							{#each logs as line (line.timestamp + line.message)}
								<tr class="border-b border-[var(--border-subtle)]">
									<td class="px-2 py-1 font-mono text-[10px] text-[var(--text-secondary)]"
										>{line.timestamp.slice(11, 19)}</td
									>
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
				title="Loading Kokoro voices"
				subtitle="Safely loading into RAM / VRAM — sit tight."
				showContent
				contentKind="dyk"
			/>
		{:else}
			<div class="flex flex-col gap-4">
				<!-- Slot load / unload -->
				<div class="flex flex-wrap items-center gap-2">
					{#if !ttsReady && ttsSlot?.assigned_model_id}
						<Button preset="button-primary" size="sm" onclick={loadTts}>
							<Play size={12} />
							Load Kokoro
						</Button>
					{/if}
					{#if ttsReady}
						<Button preset="button-ghost" size="sm" onclick={unloadTts}>
							<PowerOff size={12} />
							Unload Kokoro
						</Button>
					{/if}
					{#if !ttsSlot?.assigned_model_id}
						<Text size="xs" color="muted">
							Assign a Kokoro model in the setup wizard first.
						</Text>
					{/if}
				</div>

				{#if ttsReady}
					<!-- Voice picker -->
					<div class="flex flex-col gap-2">
						<Text size="sm" weight="bold">Voices ({voices.length})</Text>
						<div class="grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));">
							{#each voices as v (v.id)}
								<button
									type="button"
									class="flex flex-col items-start gap-0.5 rounded-lg p-3 text-left transition-colors"
									style={selectedVoice === v.id
										? "background: var(--accent-teal-fill); border: 1px solid var(--accent-teal-main);"
										: "background: var(--surface-base); border: 1px solid var(--border-subtle);"}
									onclick={() => {
										selectedVoice = v.id;
									}}
									ondblclick={() => handlePreview(v.id)}
									title="Double-click to preview"
								>
									<Text size="sm" weight="bold">{v.label}</Text>
									<Text size="xs" color="muted">{v.gender} · {v.style}</Text>
									<Text size="xs" color="muted">{v.description}</Text>
								</button>
							{/each}
						</div>
						<Text size="xs" color="muted">
							Double-click a voice to preview. Click to select.
						</Text>
					</div>

					<!-- Speed control -->
					<div class="flex flex-col gap-2">
						<Text size="sm" weight="bold">Speed · {speed.toFixed(1)}×</Text>
						<input
							type="range"
							min="0.5"
							max="2.0"
							step="0.1"
							bind:value={speed}
							class="w-full max-w-80"
							style="accent-color: var(--accent-teal-main);"
						/>
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
						<Button
							preset="button-primary"
							size="md"
							onclick={handleSpeak}
							disabled={speaking || !testText.trim()}
						>
							{#if speaking}
								<Spinner size="xs" />
								Speaking…
							{:else}
								<Volume2 size={16} />
								Speak
							{/if}
						</Button>
					</div>
				{:else}
					<Text size="sm" color="muted">
						Load Kokoro to unlock the voice picker, speed, and
						synthesis controls.
					</Text>
				{/if}

				<!-- Future -->
				<div class="rounded-lg p-3 mt-2 opacity-60" style="border: 1px dashed var(--border-subtle);">
					<Text size="sm" weight="bold">Voice cloning</Text>
					<Text size="xs" color="muted">
						Coming later. Kokoro ONNX does not currently support
						reference-based voice cloning. Custom voices can be
						created by blending existing voice embeddings (Voice
						Sprint B).
					</Text>
				</div>
			</div>
		{/if}
	{/snippet}
</ServiceDevtoolShell>
