<!--
  @file TTS Setup tab — select model, preview voices, set defaults.
  @domain voice
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import Card from "$lib/design/components/card/Card.svelte";
import { Slider } from "$lib/design/components/slider/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { SlotRow } from "$lib/domains/app/models/index.js";
import type { VoiceInfo } from "../../contracts/voice.contract.js";
import { listVoices, previewVoice } from "../../services/voice.svc.js";
import { voiceState } from "../../state/voice.state.svelte.js";

/** Orpheus voices — hardcoded until list_voices backend is wired. */
const VOICES: VoiceInfo[] = [
	{
		id: "tara",
		label: "Tara",
		gender: "female",
		sampleText: "Hello, I'm Tara. I can help you with anything.",
	},
	{
		id: "leah",
		label: "Leah",
		gender: "female",
		sampleText: "Hi there, I'm Leah. Let's get to work.",
	},
	{
		id: "jess",
		label: "Jess",
		gender: "female",
		sampleText: "Hey, I'm Jess. What are we building today?",
	},
	{
		id: "mia",
		label: "Mia",
		gender: "female",
		sampleText: "Hello, I'm Mia. I'm ready when you are.",
	},
	{
		id: "leo",
		label: "Leo",
		gender: "male",
		sampleText: "Hey, I'm Leo. Let me help you figure this out.",
	},
	{ id: "dan", label: "Dan", gender: "male", sampleText: "Hi, I'm Dan. What's on the agenda?" },
	{
		id: "zac",
		label: "Zac",
		gender: "male",
		sampleText: "Yo, I'm Zac. Let's build something cool.",
	},
	{ id: "zoe", label: "Zoe", gender: "female", sampleText: "Hi, I'm Zoe. Ready to dive in?" },
];

const m = $derived(renderForge({ kind: "card", preset: "glass-deep" }));

async function handlePreview(voice: VoiceInfo): Promise<void> {
	voiceState.selectedVoice = voice.id;
	try {
		await previewVoice(voice.id, voiceState.selectedTtsSlot);
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
		<Text size="sm" weight="semibold" preset="default">Voice Preview</Text>

		<!-- Voice grid -->
		<div class="grid grid-cols-4 gap-2">
			{#each VOICES as voice}
				<button
					class="px-3 py-2 rounded-lg text-sm font-medium transition-all
						{voiceState.selectedVoice === voice.id
							? 'bg-[var(--accent-teal-fill)] text-[var(--accent-teal-main)] border border-[var(--accent-teal-main)]'
							: 'bg-[var(--glass-void)] text-[var(--text-secondary)] border border-transparent hover:border-[var(--border-subtle)]'}"
					onclick={() => handlePreview(voice)}
				>
					<span class="block">{voice.label}</span>
					<span class="block text-xs opacity-60">{voice.gender}</span>
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

		<!-- Default indicator -->
		<div class="flex items-center justify-between mt-4 p-3 rounded-lg bg-[var(--glass-void)]">
			<Text size="sm" preset="default">
				Default Voice: <strong>{VOICES.find(v => v.id === voiceState.selectedVoice)?.label ?? "None"}</strong>
				({VOICES.find(v => v.id === voiceState.selectedVoice)?.gender ?? ""})
			</Text>
			<Button preset="primary" size="sm">Set as Default</Button>
		</div>
	</div>
</div>
