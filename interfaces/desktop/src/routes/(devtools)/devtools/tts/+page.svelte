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
import { listVoices, previewVoice, speak } from "$lib/domains/app/voice/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/_shared/index.js";
import { logInfo } from "$lib/sys/logger.js";

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
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-21): Kokoro runtime config (pitch shift,
			speaker bias, sample-rate output) not yet exposed as a Tauri
			command. Model selection lives in the setup wizard; live per-slot
			overrides arrive when <code>voice_tts_save_config</code> lands.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			TODO(reality-gap 2026-04-21): Kokoro-scoped log filter not yet
			wired. Session logs live at <span class="font-mono text-[10px]">.userdata/logs/session-*.jsonl</span> —
			filter by <code>component=devtools.tts</code>.
		</Text>
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
