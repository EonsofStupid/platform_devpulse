<!--
  @file STT Setup tab — Whisper model, mic test, VAD config.
  @domain voice
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { testMicrophone } from "../../services/voice.svc.js";
import { voiceState } from "../../state/voice.state.svelte.js";

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "es", label: "Spanish" },
	{ code: "fr", label: "French" },
	{ code: "de", label: "German" },
	{ code: "ja", label: "Japanese" },
	{ code: "zh", label: "Chinese" },
	{ code: "ko", label: "Korean" },
	{ code: "pt", label: "Portuguese" },
	{ code: "ru", label: "Russian" },
	{ code: "ar", label: "Arabic" },
];

async function handleMicTest(): Promise<void> {
	voiceState.loading = true;
	try {
		voiceState.micTest = await testMicrophone();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		voiceState.loading = false;
	}
}
</script>

<div class="flex flex-col gap-6">
	<!-- Model status -->
	<div class="flex items-center justify-between">
		<div>
			<Text size="sm" weight="semibold" preset="default">Model: Whisper Small</Text>
			<Text size="xs" preset="default" class="text-[var(--text-muted)]">Slot: voice.stt</Text>
		</div>
		<div class="flex items-center gap-3">
			<Text size="xs" preset="default">Language:</Text>
			<select
				class="bg-[var(--glass-void)] border border-[var(--border-subtle)] rounded px-2 py-1 text-sm text-[var(--text-primary)]"
				bind:value={voiceState.sttLanguage}
			>
				{#each LANGUAGES as lang}
					<option value={lang.code}>{lang.label}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Microphone test -->
	<Card preset="neuro-minimal">
		<div class="p-4 flex flex-col gap-3">
			<Text size="sm" weight="semibold" preset="default">Microphone Test</Text>

			{#if voiceState.micTest}
				<div class="flex flex-col gap-1">
					<Text size="xs" preset="default">
						Device: {voiceState.micTest.detected ? "Detected" : "Not found"}
					</Text>
					<div class="flex items-center gap-2">
						<Text size="xs" preset="default" class="w-12">Level:</Text>
						<div class="flex-1 h-2 rounded-full bg-[var(--glass-void)] overflow-hidden">
							<div
								class="h-full rounded-full bg-[var(--accent-teal-main)] transition-all"
								style="width: {Math.round(voiceState.micTest.avg_amplitude * 100)}%"
							></div>
						</div>
						<Text size="xs" preset="default" class="w-10 text-right">
							{Math.round(voiceState.micTest.avg_amplitude * 100)}%
						</Text>
					</div>
					<Text size="xs" preset="default" class="text-[var(--text-muted)]">
						Peak: {voiceState.micTest.peak_amplitude.toFixed(2)} |
						Avg: {voiceState.micTest.avg_amplitude.toFixed(2)} |
						Noise floor: {voiceState.micTest.noise_floor.toFixed(3)}
					</Text>
				</div>
			{/if}

			<Button preset="primary" size="sm" onclick={handleMicTest} disabled={voiceState.loading}>
				{voiceState.loading ? "Recording..." : "🎙 Test Microphone"}
			</Button>
		</div>
	</Card>

	<!-- VAD Sensitivity -->
	<div class="flex flex-col gap-2">
		<div class="flex items-center gap-4">
			<Text size="xs" preset="default" class="w-28">VAD Sensitivity</Text>
			<input
				type="range"
				min="0"
				max="1"
				step="0.05"
				bind:value={voiceState.vadSensitivity}
				class="flex-1 accent-[var(--accent-teal-main)]"
			/>
			<Text size="xs" preset="default" class="w-10 text-right">{voiceState.vadSensitivity.toFixed(2)}</Text>
		</div>
		<Text size="xs" preset="default" class="text-[var(--text-muted)]">
			Lower = more sensitive, triggers on quieter audio
		</Text>
	</div>

	<!-- Upgrade option -->
	<Card preset="glass-minimal">
		<div class="p-3 flex items-center justify-between">
			<div>
				<Text size="xs" weight="semibold" preset="default">Upgrade: Whisper Turbo (GPU)</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">~2GB VRAM, faster + more accurate</Text>
			</div>
			<Button preset="ghost" size="sm">Load for this session</Button>
		</div>
	</Card>
</div>
