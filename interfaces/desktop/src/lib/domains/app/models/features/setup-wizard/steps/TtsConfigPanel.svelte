<!--
  @file TtsConfigPanel.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/TtsConfigPanel

  TTS section. Shows voice.tts slot, voice profile selection, test voice.
  speak() returns "Voice TTS not yet available" — displayed raw.
-->
<script lang="ts">
import { LoaderCircle, Volume2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { statusLabel } from "../../../types/models.types.js";

const ttsStatus = $derived(modelsState.statuses["voice.tts"] ?? { type: "not_loaded" as const });
const ttsModel = $derived(modelsState.assignedModel("voice.tts"));

let voices = $state<Array<{ id: string; label: string; gender: string }>>([]);
let selectedVoice = $state("clyffy-default");
let testError = $state<string | null>(null);
let testing = $state(false);

$effect(() => {
	loadVoices();
});

async function loadVoices(): Promise<void> {
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const result = await invoke<Array<{ id: string; label: string; gender: string }>>(
			"list_voices",
			{ slotId: "voice.tts" },
		);
		voices = result;
	} catch (e) {
		console.warn("[TtsConfig] Failed to load voices:", e);
	}
}

async function testVoice(): Promise<void> {
	testing = true;
	testError = null;
	try {
		const { invoke } = await import("@tauri-apps/api/core");
		await invoke("speak", {
			text: "Hello! I'm Clyffy, your AI assistant.",
			voice: selectedVoice,
			slot: "voice.tts",
		});
	} catch (e) {
		testError = e instanceof Error ? e.message : String(e);
	} finally {
		testing = false;
	}
}
</script>

<div
	class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg w-full border")}
	style="background: var(--surface-base); border-color: var(--border-subtle);"
>
	<div class={stack({ gap: "3" })}>
		<div class={hstack({ gap: "4", align: "center" })}>
			<Volume2 size={16} style="color: var(--text-secondary);" />
			<Text size="sm" weight="bold" color="primary" class="flex-1">
				Text-to-Speech (TTS)
			</Text>
			<Badge
				variant={ttsStatus.type === "loaded" ? "positive" : ttsStatus.type === "failed" ? "negative" : "neutral"}
				size="sm"
			>
				{statusLabel(ttsStatus)}
			</Badge>
		</div>

		{#if ttsModel}
			<Text size="xs" color="muted">Model: {ttsModel.filename}</Text>
		{:else}
			<Text size="xs" color="muted">No model assigned to voice.tts slot</Text>
		{/if}

		<!-- Voice profile selection -->
		{#if voices.length > 0}
			<div class={stack({ gap: "2" })}>
				<Text size="xs" weight="bold" color="secondary">Voice Profile</Text>
				{#each voices as voice (voice.id)}
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="radio"
							name="voice-profile"
							value={voice.id}
							checked={selectedVoice === voice.id}
							onchange={() => (selectedVoice = voice.id)}
							class="accent-[var(--accent-teal-main)]"
						/>
						<Text size="xs" color="primary">
							{voice.label} ({voice.gender})
						</Text>
					</label>
				{/each}
			</div>
		{/if}

		<!-- Test voice -->
		<div class={hstack({ gap: "3", align: "center" })}>
			<button
				class="flex items-center gap-1.5 rounded px-3 py-1 text-xs transition-colors border"
				style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
				onclick={testVoice}
				disabled={testing}
				aria-label="Test voice output"
			>
				{#if testing}
					<LoaderCircle size={12} class="animate-spin" />
				{:else}
					<Volume2 size={12} />
				{/if}
				Test Voice
			</button>

			{#if testError}
				<Text size="xs" color="muted">{testError}</Text>
			{/if}
		</div>
	</div>
</div>
