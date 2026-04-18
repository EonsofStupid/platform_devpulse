<!--
	@file /devtools/tts — Text-to-Speech devtool
	@route /devtools/tts
	Voice synthesis: model load/unload, voice picker, preview, speed control.
-->
<script lang="ts">
import { Check, Play, Volume2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import { listVoices, previewVoice, speak } from "$lib/domains/app/voice/index.js";
import { logInfo } from "$lib/sys/logger.js";

let voices = $state<
	Array<{ id: string; label: string; gender: string; style: string; description: string }>
>([]);
let selectedVoice = $state("af_heart");
let speed = $state(1.0);
let testText = $state("Hello, I'm Clyffy. Welcome to DevPulse.");
let speaking = $state(false);
let loadingSlot = $state(false);
let voicesLoaded = $state(false);

const ttsStatus = $derived(modelsState.statuses["voice.tts"]);
const ttsReady = $derived(ttsStatus ? isInferenceReady(ttsStatus) : false);
const ttsSlot = $derived(modelsState.slots.find((s) => s.id === "voice.tts"));

async function loadTts(): Promise<void> {
	loadingSlot = true;
	logInfo("devtools.tts", "Loading voice.tts slot");
	try {
		await modelsState.load("voice.tts");
		logInfo("devtools.tts", "voice.tts loaded");
	} catch (e) {
		logInfo("devtools.tts", `voice.tts load failed: ${e}`);
	} finally {
		loadingSlot = false;
	}
}

async function unloadTts(): Promise<void> {
	loadingSlot = true;
	try {
		await modelsState.unload("voice.tts");
		logInfo("devtools.tts", "voice.tts unloaded");
	} finally {
		loadingSlot = false;
	}
}

async function fetchVoices(): Promise<void> {
	try {
		const result = await listVoices("voice.tts");
		voices = result;
		voicesLoaded = true;
		logInfo("devtools.tts", `Loaded ${result.length} voices`);
	} catch (e) {
		logInfo("devtools.tts", `listVoices failed: ${e}`);
	}
}

async function handlePreview(voiceId: string): Promise<void> {
	logInfo("devtools.tts", `Preview voice: ${voiceId}`);
	try {
		await previewVoice(voiceId, "voice.tts");
	} catch (e) {
		logInfo("devtools.tts", `Preview failed: ${e}`);
	}
}

async function handleSpeak(): Promise<void> {
	if (!testText.trim()) return;
	speaking = true;
	logInfo(
		"devtools.tts",
		`speak() — voice=${selectedVoice} speed=${speed} text="${testText.slice(0, 50)}"`,
	);
	try {
		await speak(testText, selectedVoice, "voice.tts", speed);
		logInfo("devtools.tts", "speak() complete");
	} catch (e) {
		logInfo("devtools.tts", `speak() failed: ${e}`);
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

<div class="tts-page">
	<Heading level={2} size="xl">Text-to-Speech</Heading>

	<section class="slot-controls">
		<div class="slot-row">
			<Text size="sm" weight="bold">voice.tts</Text>
			{#if ttsReady}
				<Badge tone="positive" size="sm"><Check size={8} /> Ready</Badge>
			{:else if ttsSlot?.assigned_model_id}
				<Badge tone="neutral" size="sm">Assigned</Badge>
			{:else}
				<Badge tone="neutral" size="sm">Empty</Badge>
			{/if}
			{#if !ttsReady && ttsSlot?.assigned_model_id}
				<Button preset="button-primary" size="sm" onclick={loadTts} disabled={loadingSlot}>
					{#if loadingSlot}<Spinner size="xs" />{:else}<Play size={12} />{/if}
					Load
				</Button>
			{/if}
			{#if ttsReady}
				<Button preset="button-ghost" size="sm" onclick={unloadTts} disabled={loadingSlot}>Unload</Button>
			{/if}
		</div>
	</section>

	{#if ttsReady}
		<section class="voice-picker">
			<Text size="sm" weight="bold">Voices ({voices.length})</Text>
			<div class="voice-grid">
				{#each voices as v (v.id)}
					<button
						class="voice-card"
						class:selected={selectedVoice === v.id}
						onclick={() => { selectedVoice = v.id; }}
						ondblclick={() => handlePreview(v.id)}
					>
						<Text size="sm" weight="bold">{v.label}</Text>
						<Text size="xs" class="voice-meta">{v.gender} · {v.style}</Text>
						<Text size="xs" class="voice-desc">{v.description}</Text>
					</button>
				{/each}
			</div>
			<Text size="xs" class="voice-hint">Double-click a voice to preview. Click to select.</Text>
		</section>

		<section class="speed-control">
			<Text size="sm" weight="bold">Speed: {speed.toFixed(1)}x</Text>
			<input type="range" min="0.5" max="2.0" step="0.1" bind:value={speed} class="speed-slider" />
		</section>

		<section class="speak-test">
			<Text size="sm" weight="bold">Test Synthesis</Text>
			<textarea class="test-input" bind:value={testText} rows={3} placeholder="Type text to speak..."></textarea>
			<Button preset="button-primary" size="md" onclick={handleSpeak} disabled={speaking || !testText.trim()}>
				{#if speaking}
					<Spinner size="xs" />
					Speaking...
				{:else}
					<Volume2 size={16} />
					Speak
				{/if}
			</Button>
		</section>
	{:else}
		<div class="empty-state">
			<Text size="sm" class="empty-text">Load the voice.tts model to access voice controls.</Text>
		</div>
	{/if}

	<section class="future-section">
		<Text size="sm" weight="bold">Voice Cloning</Text>
		<Text size="xs" class="future-text">
			Coming soon — Kokoro ONNX does not currently support reference-based voice cloning.
			Custom voices can be created by blending existing voice embeddings (Sprint B).
		</Text>
	</section>
</div>

<style>
	.tts-page {
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

	.voice-picker {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.voice-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
		gap: 0.5rem;
	}

	.voice-card {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.75rem;
		border-radius: 0.5rem;
		border: 0.0625rem solid var(--border-soft);
		background: var(--surface-raised);
		cursor: pointer;
		text-align: left;
		transition: all 150ms ease-out;
	}
	.voice-card:hover {
		border-color: var(--border-default);
	}
	.voice-card.selected {
		border-color: var(--accent-teal-main);
		background: color-mix(in oklch, var(--accent-teal-fill) 60%, transparent);
	}

	:global(.voice-meta) { color: var(--text-muted); }
	:global(.voice-desc) { color: var(--text-muted); }
	:global(.voice-hint) { color: var(--text-muted); }

	.speed-control {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.speed-slider {
		width: 100%;
		max-width: 20rem;
		accent-color: var(--accent-teal-main);
	}

	.speak-test {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.test-input {
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 0.0625rem solid var(--border-soft);
		background: var(--surface-raised);
		color: var(--text-primary);
		font-size: 0.875rem;
		font-family: inherit;
		resize: vertical;
	}
	.test-input:focus {
		border-color: var(--accent-teal-main);
		outline: none;
	}

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
