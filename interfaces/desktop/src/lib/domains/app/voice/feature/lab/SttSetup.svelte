<!--
  @file STT Setup tab — Whisper model, mic test, VAD config.
  @domain voice
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { commands, type SlotInfo, type VoiceStatusInfo } from "$lib/sys/generated/bindings.js";
import { voiceState } from "../../data-access/voice.state.svelte.js";
import { testMicrophone } from "../../data-access/voice.svc.js";

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

let sttSlot = $state<SlotInfo | null>(null);
let voiceStatus = $state<VoiceStatusInfo | null>(null);
let loadError = $state<string | null>(null);

function describeSlotConfig(slot: SlotInfo | null): string {
	if (!slot) return "Slot not found in registry";
	if (slot.assigned_model_id) return "Assigned from model registry";
	if (slot.default_model) return "Bundled default configured";
	return "No model assigned";
}

async function refreshSttRuntime(): Promise<void> {
	try {
		const [statusResult, slotsResult] = await Promise.all([
			commands.getVoiceStatus(),
			commands.getSlots(),
		]);
		if (statusResult.status === "error") {
			throw new Error(statusResult.error);
		}
		if (slotsResult.status === "error") {
			throw new Error(slotsResult.error);
		}
		voiceStatus = statusResult.data;
		sttSlot = slotsResult.data.find((slot) => slot.id === "voice.stt") ?? null;
		loadError = null;
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	}
}

$effect(() => {
	void refreshSttRuntime();
});

async function handleLoadStt(): Promise<void> {
	voiceState.loading = true;
	try {
		const result = await commands.loadSlot("voice.stt");
		if (result.status === "error") {
			throw new Error(result.error);
		}
		await refreshSttRuntime();
	} catch (e) {
		voiceState.error = e instanceof Error ? e.message : String(e);
	} finally {
		voiceState.loading = false;
	}
}

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
			<Text size="sm" weight="semibold" preset="default">{sttSlot?.label ?? "Voice Input"}</Text>
			<Text size="xs" preset="default" class="text-[var(--text-muted)]">Slot: voice.stt</Text>
			<Text size="xs" preset="default" class="text-[var(--text-muted)]">
				{voiceStatus?.stt_loaded ? "Loaded" : "Not loaded"} · {sttSlot?.runtime ?? "Unknown backend"} · {sttSlot?.loading_strategy ?? "Unknown loading"}
			</Text>
			<Text size="xs" preset="default" class="text-[var(--text-muted)]">{describeSlotConfig(sttSlot)}</Text>
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
			<Button preset="secondary" size="sm" onclick={handleLoadStt} disabled={voiceState.loading || voiceStatus?.stt_loaded}>
				{voiceStatus?.stt_loaded ? "Loaded" : "Load voice input"}
			</Button>
		</div>
	</div>

	{#if loadError}
		<Text size="xs" preset="default" class="text-[var(--accent-ember-main)]">{loadError}</Text>
	{/if}

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

	<!-- Runtime note -->
	<Card preset="glass-minimal">
		<div class="p-3 flex items-center justify-between">
			<div>
				<Text size="xs" weight="semibold" preset="default">Live slot, not a fake profile</Text>
				<Text size="xs" preset="default" class="text-[var(--text-muted)]">Swap the STT model through slot assignment, then load `voice.stt` here to test the runtime you actually configured.</Text>
			</div>
			<Button preset="ghost" size="sm" onclick={handleLoadStt} disabled={voiceState.loading || voiceStatus?.stt_loaded}>
				{voiceStatus?.stt_loaded ? "Ready" : "Load now"}
			</Button>
		</div>
	</Card>
</div>
