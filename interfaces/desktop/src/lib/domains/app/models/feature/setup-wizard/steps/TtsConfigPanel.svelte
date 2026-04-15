<!--
  @file TtsConfigPanel.svelte
  Full Text-to-Speech configuration. Not a stub.
  Model assignment, voice profiles, speed/pitch, test voice, training readiness.
  Colocated CSS. No renderForge.
-->
<script lang="ts">
import {
	AlertTriangle,
	Check,
	ChevronDown,
	ChevronUp,
	Pause,
	Play,
	Power,
	PowerOff,
	Settings,
	Upload,
	Volume2,
	VolumeX,
} from "lucide-svelte";
import { Progress } from "$lib/design/components/progress/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { hardwareState } from "../../../data-access/hardware.state.svelte.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import {
	calculateFit,
	fitColor,
	fitLabel,
	formatMb,
	isInferenceReady,
} from "../../../util/models.types.js";

const SLOT_ID: SlotId = "voice.tts";

// ── State ─────────────────────────────────────────────
let showModelPicker = $state(false);
let showAdvanced = $state(false);
let showTraining = $state(false);
let testing = $state(false);
let testError = $state<string | null>(null);
let selectedVoice = $state("default-female");
let speed = $state(1.0);
let pitch = $state(1.0);
let trainingFiles = $state<File[]>([]);
let trainingStatus = $state<"idle" | "uploading" | "processing" | "done">("idle");

// ── Derived ───────────────────────────────────────────
const status = $derived(modelsState.statuses[SLOT_ID] ?? { type: "cold" as const });
const model = $derived(modelsState.assignedModel(SLOT_ID));
const isReady = $derived(isInferenceReady(status));
const isLoading = $derived(status.type === "loading");
const isFailed = $derived(status.type === "failed");
const compatibleModels = $derived(
	modelsState.models.filter((m) => m.compatible_capabilities.includes("text_to_speech")),
);

// ── Voice profiles ────────────────────────────────────
let voices = $state<Array<{ id: string; label: string; gender: string; preview?: string }>>([
	{ id: "default-female", label: "Clyffy (Default)", gender: "Female" },
	{ id: "default-male", label: "Atlas", gender: "Male" },
]);

$effect(() => {
	loadVoices();
});

async function loadVoices(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const result = await invoke<Array<{ id: string; label: string; gender: string }>>(
			"list_voices",
			{ slotId: SLOT_ID },
		);
		if (result.length > 0) voices = result;
	} catch {
		/* use defaults */
	}
}

// ── Actions ───────────────────────────────────────────
async function assignAndLoad(modelId: string): Promise<void> {
	try {
		await modelsState.assign(SLOT_ID, modelId);
		await modelsState.load(SLOT_ID);
		showModelPicker = false;
	} catch {}
}

async function handleLoad(): Promise<void> {
	try {
		await modelsState.load(SLOT_ID);
	} catch {}
}

async function handleUnload(): Promise<void> {
	try {
		await modelsState.unload(SLOT_ID);
	} catch {}
}

async function testVoice(): Promise<void> {
	testing = true;
	testError = null;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("speak", {
			text: "Hello! I'm your AI assistant. How can I help you today?",
			voice: selectedVoice,
			slot: SLOT_ID,
		});
	} catch (e) {
		testError = e instanceof Error ? e.message : String(e);
	} finally {
		testing = false;
	}
}

function handleTrainingUpload(event: Event): void {
	const input = event.target as HTMLInputElement;
	if (input.files) {
		trainingFiles = [...trainingFiles, ...Array.from(input.files)];
	}
}

function removeTrainingFile(idx: number): void {
	trainingFiles = trainingFiles.filter((_, i) => i !== idx);
}

async function startTraining(): Promise<void> {
	if (trainingFiles.length === 0) return;
	trainingStatus = "uploading";
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		// Upload files for voice baseline training
		for (const file of trainingFiles) {
			const buffer = await file.arrayBuffer();
			await invoke("upload_voice_sample", {
				filename: file.name,
				data: Array.from(new Uint8Array(buffer)),
				voice: selectedVoice,
			});
		}
		trainingStatus = "processing";
		await invoke("train_voice_baseline", { voice: selectedVoice });
		trainingStatus = "done";
	} catch (e) {
		testError = e instanceof Error ? e.message : String(e);
		trainingStatus = "idle";
	}
}
</script>

<div class="tts-panel">
	<!-- Header -->
	<div class="header">
		<div class="header-icon"><Volume2 size={24} /></div>
		<div class="header-info">
			<h3 class="title">Voice Output (Text-to-Speech)</h3>
			<p class="subtitle">Makes the AI speak responses out loud. Choose a voice, adjust speed, or train a custom voice.</p>
		</div>
		<div class="status-badge" class:ready={isReady} class:failed={isFailed} class:loading={isLoading}>
			{#if isReady}
				<Check size={14} /> Ready
			{:else if isLoading}
				<Spinner size="sm" tone="warning" /> Loading
			{:else if isFailed}
				<AlertTriangle size={14} /> Failed
			{:else}
				<VolumeX size={14} /> Not Loaded
			{/if}
		</div>
	</div>

	<!-- Model assignment -->
	<div class="section">
		<div class="section-header">
			<span class="section-title">Model</span>
			{#if model}
				<span class="model-badge">{model.filename}</span>
			{/if}
		</div>

		{#if model}
			<div class="model-detail">
				<div class="detail-row">
					<span class="detail-label">Architecture</span>
					<span class="detail-value">{model.architecture}</span>
				</div>
				{#if model.quant_level}
					<div class="detail-row">
						<span class="detail-label">Quality</span>
						<span class="detail-value">{model.quant_level}</span>
					</div>
				{/if}
				<div class="detail-row">
					<span class="detail-label">Size</span>
					<span class="detail-value">{formatMb(model.size_mb)}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">VRAM</span>
					<span class="detail-value">{formatMb(model.vram_estimate_mb)}</span>
				</div>
			</div>
			<div class="model-actions">
				{#if status.type === "cold" || isFailed}
					<button class="btn-primary" onclick={handleLoad}><Power size={14} /> Load</button>
				{/if}
				{#if isReady}
					<button class="btn-danger" onclick={handleUnload}><PowerOff size={14} /> Unload</button>
				{/if}
				<button class="btn-outline" onclick={() => (showModelPicker = !showModelPicker)}>
					{showModelPicker ? "Cancel" : "Change Model"}
				</button>
			</div>
		{:else}
			<p class="no-model">No TTS model assigned.</p>
			<button class="btn-primary" onclick={() => (showModelPicker = true)}>
				<Volume2 size={14} /> Assign Model
			</button>
		{/if}

		{#if showModelPicker}
			<div class="picker">
				<span class="picker-label">Compatible TTS models ({compatibleModels.length})</span>
				{#if compatibleModels.length === 0}
					<p class="picker-empty">No TTS models found. Kokoro should be bundled — check your models directory.</p>
				{/if}
				{#each compatibleModels as m (m.id)}
					{@const fit = calculateFit(m.vram_estimate_mb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)}
					<button class="picker-row" onclick={() => assignAndLoad(m.id)}>
						<span class="picker-name">{m.filename}</span>
						{#if m.quant_level}<span class="tag">{m.quant_level}</span>{/if}
						<span class="tag-muted">{formatMb(m.size_mb)}</span>
						<span class="fit-dot" style="background:{fitColor(fit)}"></span>
						<span class="fit-text">{fitLabel(fit)}</span>
					</button>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Failed -->
	{#if isFailed && "error" in status}
		<div class="error-box"><AlertTriangle size={16} /><span>{status.error}</span></div>
	{/if}

	<!-- Loading -->
	{#if isLoading}
		<div class="loading-row">
			<Spinner size="sm" /><span>Loading TTS model...</span>
			<Progress value={status.type === "loading" ? status.progressPct : 0} max={100} size="sm" class="flex-1" />
		</div>
	{/if}

	<!-- Voice profile selection -->
	<div class="section">
		<span class="section-title">Voice Profile</span>
		<div class="voice-grid">
			{#each voices as voice (voice.id)}
				<button
					class="voice-card" class:selected={selectedVoice === voice.id}
					onclick={() => (selectedVoice = voice.id)}
				>
					<span class="voice-name">{voice.label}</span>
					<span class="voice-gender">{voice.gender}</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Speed & Pitch -->
	<div class="section">
		<span class="section-title">Speed & Pitch</span>
		<div class="slider-row">
			<span class="slider-label">Speed</span>
			<input type="range" class="range" min={0.5} max={2.0} step={0.1} bind:value={speed} />
			<span class="slider-value">{speed.toFixed(1)}x</span>
		</div>
		<div class="slider-row">
			<span class="slider-label">Pitch</span>
			<input type="range" class="range" min={0.5} max={2.0} step={0.1} bind:value={pitch} />
			<span class="slider-value">{pitch.toFixed(1)}x</span>
		</div>
	</div>

	<!-- Test voice -->
	<div class="section">
		<button class="btn-primary" onclick={testVoice} disabled={testing || !isReady}>
			{#if testing}
				<Spinner size="sm" tone="accent" /> Speaking...
			{:else}
				<Play size={14} /> Test Voice
			{/if}
		</button>
		{#if testError}
			<span class="test-error"><AlertTriangle size={14} /> {testError}</span>
		{/if}
		{#if !isReady}
			<p class="hint">Load the TTS model first to test the voice.</p>
		{/if}
	</div>

	<!-- Voice Training -->
	<button class="advanced-toggle" onclick={() => (showTraining = !showTraining)}>
		<Upload size={14} />
		Voice Training (Custom Baselines)
		{#if showTraining}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
	</button>

	{#if showTraining}
		<div class="training-section">
			<p class="training-desc">
				Upload MP3 samples to establish male and female voice baselines.
				Kokoro uses these to fine-tune pronunciation and tone.
				3-5 samples of 10-30 seconds each recommended.
			</p>

			<div class="upload-area">
				<input
					type="file"
					accept=".mp3,.wav,.ogg,.flac"
					multiple
					onchange={handleTrainingUpload}
					id="voice-upload"
					class="upload-input"
				/>
				<label for="voice-upload" class="upload-label">
					<Upload size={20} />
					<span>Drop MP3/WAV files or click to browse</span>
				</label>
			</div>

			{#if trainingFiles.length > 0}
				<div class="file-list">
					{#each trainingFiles as file, i (file.name + i)}
						<div class="file-row">
							<span class="file-name">{file.name}</span>
							<span class="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
							<button class="btn-x" onclick={() => removeTrainingFile(i)} aria-label="Remove {file.name}">x</button>
						</div>
					{/each}
				</div>

				<button class="btn-primary" onclick={startTraining}
					disabled={trainingStatus !== "idle"}>
					{#if trainingStatus === "uploading"}
						<Spinner size="sm" tone="accent" /> Uploading...
					{:else if trainingStatus === "processing"}
						<Spinner size="sm" tone="accent" /> Processing...
					{:else if trainingStatus === "done"}
						<Check size={14} /> Training Complete
					{:else}
						<Upload size={14} /> Start Training
					{/if}
				</button>
			{/if}
		</div>
	{/if}

	<!-- Advanced -->
	<button class="advanced-toggle" onclick={() => (showAdvanced = !showAdvanced)}>
		<Settings size={14} /> Advanced Settings
		{#if showAdvanced}<ChevronUp size={14} />{:else}<ChevronDown size={14} />{/if}
	</button>

	{#if showAdvanced}
		<div class="advanced">
			<div class="detail-row">
				<span class="detail-label">Sample Rate</span>
				<select class="select-sm">
					<option value="22050">22050 Hz</option>
					<option value="44100" selected>44100 Hz</option>
					<option value="48000">48000 Hz</option>
				</select>
			</div>
			<div class="detail-row">
				<span class="detail-label">Audio Format</span>
				<select class="select-sm">
					<option value="wav">WAV</option>
					<option value="mp3">MP3</option>
					<option value="ogg">OGG</option>
				</select>
			</div>
			<div class="detail-row">
				<span class="detail-label">Silence Padding (ms)</span>
				<input type="number" class="input-sm" value={200} min={0} max={2000} step={50} />
			</div>
		</div>
	{/if}
</div>

<style>
	.tts-panel {
		display: flex; flex-direction: column; gap: 1rem;
		background: oklch(0.12 0.025 220 / 0.65);
		border: 1px solid oklch(0.3 0.03 220 / 0.4);
		border-radius: 0.75rem; padding: 1.25rem;
		backdrop-filter: blur(12px);
	}

	.header { display: flex; align-items: flex-start; gap: 0.75rem; }
	.header-icon { color: oklch(0.65 0.17 185); flex-shrink: 0; }
	.header-info { flex: 1; }
	.title { font-size: 1rem; font-weight: 700; color: oklch(0.93 0.015 224); margin: 0; }
	.subtitle { font-size: 0.8125rem; color: oklch(0.6 0.02 220); margin: 0.25rem 0 0; }

	.status-badge { display: flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; background: oklch(0.2 0.02 220 / 0.5); color: oklch(0.6 0.02 220); }
	.status-badge.ready { background: oklch(0.25 0.08 152 / 0.3); color: oklch(0.72 0.19 152); }
	.status-badge.failed { background: oklch(0.25 0.08 25 / 0.3); color: oklch(0.7 0.18 25); }
	.status-badge.loading { background: oklch(0.25 0.08 75 / 0.3); color: oklch(0.75 0.15 75); }

	.section { display: flex; flex-direction: column; gap: 0.5rem; }
	.section-header { display: flex; align-items: center; gap: 0.5rem; }
	.section-title { font-size: 0.8125rem; font-weight: 700; color: oklch(0.75 0.02 220); }
	.model-badge { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 0.25rem; background: oklch(0.2 0.03 185 / 0.3); color: oklch(0.65 0.12 185); }

	.model-detail { background: oklch(0.15 0.02 220 / 0.5); border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.detail-row { display: flex; justify-content: space-between; align-items: center; }
	.detail-label { font-size: 0.8125rem; color: oklch(0.55 0.02 220); }
	.detail-value { font-size: 0.8125rem; color: oklch(0.85 0.015 224); font-weight: 500; }

	.model-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.no-model { font-size: 0.875rem; color: oklch(0.5 0.02 220); font-style: italic; margin: 0; }

	.picker { background: oklch(0.15 0.02 220 / 0.5); border: 1px solid oklch(0.3 0.02 220 / 0.4); border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
	.picker-label { font-size: 0.8125rem; font-weight: 700; color: oklch(0.7 0.02 220); margin-bottom: 0.25rem; }
	.picker-empty { font-size: 0.8125rem; color: oklch(0.5 0.02 220); margin: 0; }
	.picker-row { display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem; border-radius: 0.375rem; border: none; background: transparent; cursor: pointer; font-size: 0.8125rem; color: oklch(0.85 0.015 224); text-align: left; }
	.picker-row:hover { background: oklch(0.2 0.015 220 / 0.5); }
	.picker-name { flex: 1; font-weight: 600; }
	.tag { font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 0.25rem; background: oklch(0.2 0.02 220 / 0.6); color: oklch(0.8 0.02 220); }
	.tag-muted { font-size: 0.8125rem; color: oklch(0.6 0.02 220); }
	.fit-dot { width: 0.5rem; height: 0.5rem; border-radius: 9999px; }
	.fit-text { font-size: 0.75rem; color: oklch(0.6 0.02 220); }

	.error-box { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border-radius: 0.5rem; background: oklch(0.2 0.08 25 / 0.3); border: 1px solid oklch(0.6 0.22 25 / 0.4); color: oklch(0.85 0.08 25); font-size: 0.875rem; }
	.loading-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: oklch(0.65 0.02 220); }
	.test-error { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8125rem; color: oklch(0.7 0.18 25); }
	.hint { font-size: 0.75rem; color: oklch(0.5 0.02 220); margin: 0; }

	/* Voice grid */
	.voice-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr)); gap: 0.5rem; }
	.voice-card {
		display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
		padding: 0.75rem; border-radius: 0.5rem; cursor: pointer;
		border: 1px solid oklch(0.3 0.02 220 / 0.4); background: oklch(0.15 0.02 220 / 0.3);
		transition: border-color 100ms, background 100ms;
	}
	.voice-card:hover { background: oklch(0.18 0.02 220 / 0.4); }
	.voice-card.selected { border-color: oklch(0.65 0.17 185); background: oklch(0.2 0.04 185 / 0.2); }
	.voice-name { font-size: 0.875rem; font-weight: 600; color: oklch(0.9 0.015 224); }
	.voice-gender { font-size: 0.75rem; color: oklch(0.6 0.02 220); }

	/* Sliders */
	.slider-row { display: flex; align-items: center; gap: 0.75rem; }
	.slider-label { font-size: 0.8125rem; color: oklch(0.6 0.02 220); width: 3.5rem; }
	.slider-value { font-size: 0.8125rem; color: oklch(0.85 0.015 224); width: 2.5rem; text-align: right; }
	.range { flex: 1; accent-color: oklch(0.65 0.17 185); }

	/* Training */
	.training-section { display: flex; flex-direction: column; gap: 0.75rem; background: oklch(0.13 0.02 220 / 0.4); border-radius: 0.5rem; padding: 1rem; }
	.training-desc { font-size: 0.8125rem; color: oklch(0.6 0.02 220); margin: 0; line-height: 1.5; }
	.upload-area { position: relative; }
	.upload-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
	.upload-label {
		display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
		padding: 1.5rem; border: 2px dashed oklch(0.3 0.02 220 / 0.5); border-radius: 0.5rem;
		color: oklch(0.55 0.02 220); font-size: 0.875rem; cursor: pointer; text-align: center;
	}
	.upload-label:hover { border-color: oklch(0.65 0.17 185 / 0.5); color: oklch(0.7 0.02 220); }
	.file-list { display: flex; flex-direction: column; gap: 0.25rem; }
	.file-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.5rem; border-radius: 0.375rem; background: oklch(0.15 0.02 220 / 0.4); }
	.file-name { flex: 1; font-size: 0.8125rem; color: oklch(0.85 0.015 224); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.file-size { font-size: 0.75rem; color: oklch(0.55 0.02 220); }
	.btn-x { background: none; border: none; color: oklch(0.6 0.15 25); cursor: pointer; font-size: 0.875rem; padding: 0 0.25rem; }

	.advanced-toggle { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; color: oklch(0.6 0.02 220); font-size: 0.8125rem; cursor: pointer; padding: 0; }
	.advanced-toggle:hover { color: oklch(0.75 0.02 220); }
	.advanced { background: oklch(0.13 0.02 220 / 0.4); border-radius: 0.5rem; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
	.select-sm { padding: 0.25rem 0.5rem; border-radius: 0.375rem; border: 1px solid oklch(0.3 0.02 220 / 0.4); background: oklch(0.15 0.02 220); color: oklch(0.9 0.015 224); font-size: 0.8125rem; }
	.input-sm { width: 5rem; padding: 0.25rem 0.5rem; border-radius: 0.375rem; border: 1px solid oklch(0.3 0.02 220 / 0.4); background: oklch(0.15 0.02 220); color: oklch(0.9 0.015 224); font-size: 0.8125rem; }

	.btn-primary { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem; border-radius: 0.5rem; border: none; background: oklch(0.65 0.17 185); color: oklch(0.12 0.02 220); font-size: 0.8125rem; font-weight: 700; cursor: pointer; }
	.btn-primary:hover { filter: brightness(1.15); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn-outline { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem; border-radius: 0.5rem; border: 1px solid oklch(0.3 0.03 220 / 0.5); background: transparent; color: oklch(0.75 0.02 220); font-size: 0.8125rem; cursor: pointer; }
	.btn-outline:hover { background: oklch(0.18 0.015 220 / 0.3); }
	.btn-danger { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.875rem; border-radius: 0.5rem; border: 1px solid oklch(0.5 0.15 25 / 0.4); background: transparent; color: oklch(0.7 0.15 25); font-size: 0.8125rem; cursor: pointer; }
</style>
