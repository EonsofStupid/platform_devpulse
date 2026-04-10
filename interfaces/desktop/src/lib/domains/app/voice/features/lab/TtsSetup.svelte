<!--
  @file TTS Setup tab — select model, preview voices, set defaults.
  @domain voice
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import type { VoiceInfo } from "../../contracts/voice.contract.js";
import {
	listVoices,
	previewVoice,
	runStsPipeline,
	transcribeAudioFile,
} from "../../services/voice.svc.js";
import { voiceState } from "../../state/voice.state.svelte.js";

// Voices are loaded from the Rust registry at runtime — never hardcoded.
let voices = $state<VoiceInfo[]>([]);
let loadError = $state<string | null>(null);
let filterGender = $state<"all" | "female" | "male" | "neutral">("all");

const filteredVoices = $derived(
	filterGender === "all" ? voices : voices.filter((v) => v.gender === filterGender),
);

const m = $derived(renderForge({ kind: "card", preset: "glass-deep" }));

async function loadVoiceRegistry(): Promise<void> {
	try {
		voices = await listVoices(voiceState.selectedTtsSlot);
		loadError = null;
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	}
}

$effect(() => {
	loadVoiceRegistry();
});

async function handlePreview(voice: VoiceInfo): Promise<void> {
	voiceState.selectedVoice = voice.id;
	try {
		await previewVoice(voice.id, voiceState.selectedTtsSlot);
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}

async function handleMp3Upload(event: Event): Promise<void> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	// Tauri exposes the File with an associated filesystem path on desktop.
	// If that isn't available (web preview), ask the user to select via the
	// native file dialog instead — but for now we rely on the path.
	const path = (file as unknown as { path?: string }).path;
	if (!path) {
		voiceState.error = "Could not resolve file path — use the native dialog instead";
		return;
	}
	try {
		const transcript = await transcribeAudioFile(path);
		voiceState.lastTranscript = transcript;
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}

async function handleStsRun(event: Event): Promise<void> {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	if (!file) return;
	const path = (file as unknown as { path?: string }).path;
	if (!path) {
		voiceState.error = "Could not resolve file path — use the native dialog instead";
		return;
	}
	try {
		const result = await runStsPipeline(path, null, voiceState.selectedVoice, 256);
		voiceState.lastTranscript = result.transcript;
		voiceState.lastReply = result.reply;
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	}
}
</script>

<div class="flex gap-6">
	<!-- Left: Slot cards -->
	<div class="flex flex-col gap-4 w-64 shrink-0">
		<Text size="sm" weight="semibold" preset="default">TTS Slots</Text>

		<Card preset="neuro-minimal">
			<div class="p-3 flex flex-col gap-2">
				<Text size="xs" weight="semibold" preset="default">Primary Voice</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">Slot: voice.tts.primary</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">Model: Kokoro (ort)</Text>
			</div>
		</Card>

		<Card preset="neuro-minimal">
			<div class="p-3 flex flex-col gap-2">
				<Text size="xs" weight="semibold" preset="default">Premium Voice</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">Slot: voice.tts.secondary</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">Model: Orpheus (llama.cpp)</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">Requires: SNAC decoder</Text>
			</div>
		</Card>
	</div>

	<!-- Right: Voice picker + controls -->
	<div class="flex-1 flex flex-col gap-4" {...m.dataAttrs} style={cssVarString(m.cssVars)}>
		<div class="flex items-center justify-between">
			<Text size="sm" weight="semibold" preset="default">
				Voice Preview ({voices.length} loaded from registry)
			</Text>
			<div class="flex items-center gap-2">
				<Text size="xs" preset="default">Filter:</Text>
				<select
					class="bg-[var(--glass-void)] border border-[var(--border-subtle)] rounded px-2 py-1 text-xs text-[var(--text-primary)]"
					bind:value={filterGender}
				>
					<option value="all">All</option>
					<option value="female">Female</option>
					<option value="male">Male</option>
					<option value="neutral">Neutral</option>
				</select>
			</div>
		</div>

		{#if loadError}
			<Text size="xs" preset="default" class="text-[var(--accent-ember-main)]">
				Failed to load voice registry: {loadError}
			</Text>
		{/if}

		<!-- Voice grid -->
		<div class="grid grid-cols-4 gap-2">
			{#each filteredVoices as voice}
				<button
					class="px-3 py-2 rounded-lg text-sm font-medium transition-all text-left
						{voiceState.selectedVoice === voice.id
							? 'bg-[var(--accent-teal-fill)] text-[var(--accent-teal-main)] border border-[var(--accent-teal-main)]'
							: 'bg-[var(--glass-void)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-subtle)]'}"
					onclick={() => handlePreview(voice)}
				>
					<span class="block font-semibold">{voice.label}</span>
					<span class="block text-xs opacity-60">{voice.gender} · {voice.language}</span>
					<span class="block text-xs opacity-50 truncate">{voice.description}</span>
				</button>
			{/each}
		</div>

		<!-- Speed control -->
		<div class="flex items-center gap-4 mt-4">
			<Text size="xs" preset="default" class="w-16">Speed</Text>
			<input
				type="range"
				min="0.5"
				max="2.0"
				step="0.05"
				bind:value={voiceState.speechSpeed}
				class="flex-1 accent-[var(--accent-teal-main)]"
			/>
			<Text size="xs" preset="default" class="w-12 text-right">{voiceState.speechSpeed.toFixed(2)}x</Text>
		</div>

		<!-- MP3 upload + STS pipeline -->
		<Card preset="neuro-minimal">
			<div class="p-4 flex flex-col gap-3">
				<Text size="sm" weight="semibold" preset="default">Audio File → Speech</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">
					Upload MP3/WAV/FLAC to transcribe, or run the full speech-to-speech pipeline (STT → brain → TTS).
				</Text>
				<div class="flex flex-wrap items-center gap-3">
					<label class="cursor-pointer">
						<input
							type="file"
							accept="audio/mpeg,audio/wav,audio/flac,audio/ogg"
							class="hidden"
							onchange={handleMp3Upload}
						/>
						<span class="inline-flex items-center px-3 py-1.5 rounded-lg bg-[var(--glass-void)] border border-[var(--border-subtle)] text-xs hover:border-[var(--accent-teal-main)]">
							Upload &amp; Transcribe
						</span>
					</label>
					<label class="cursor-pointer">
						<input
							type="file"
							accept="audio/mpeg,audio/wav,audio/flac,audio/ogg"
							class="hidden"
							onchange={handleStsRun}
						/>
						<span class="inline-flex items-center px-3 py-1.5 rounded-lg bg-[var(--accent-teal-fill)] border border-[var(--accent-teal-main)] text-[var(--accent-teal-main)] text-xs hover:brightness-125">
							Run Speech-to-Speech
						</span>
					</label>
				</div>
				{#if voiceState.lastTranscript}
					<div class="mt-2 p-2 rounded bg-[var(--glass-void)] border border-[var(--border-subtle)]">
						<Text size="xs" weight="semibold" preset="default">Transcript</Text>
						<Text size="xs" preset="default" class="text-[var(--text-muted)]">{voiceState.lastTranscript}</Text>
					</div>
				{/if}
				{#if voiceState.lastReply}
					<div class="p-2 rounded bg-[var(--glass-void)] border border-[var(--accent-teal-main)]">
						<Text size="xs" weight="semibold" preset="default">Reply</Text>
						<Text size="xs" preset="default">{voiceState.lastReply}</Text>
					</div>
				{/if}
			</div>
		</Card>

		<!-- Default indicator -->
		<div class="flex items-center justify-between mt-4 p-3 rounded-lg bg-[var(--glass-void)]">
			<Text size="sm" preset="default">
				Default Voice: <strong>{voices.find((v) => v.id === voiceState.selectedVoice)?.label ?? "None"}</strong>
				({voices.find((v) => v.id === voiceState.selectedVoice)?.gender ?? ""})
			</Text>
			<Button preset="primary" size="sm">Set as Default</Button>
		</div>
	</div>
</div>
