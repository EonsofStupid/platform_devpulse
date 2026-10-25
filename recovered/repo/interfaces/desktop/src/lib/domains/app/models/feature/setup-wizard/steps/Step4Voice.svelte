<!--
  @file Step-4-Voice.svelte
  Voice pipeline: STT, TTS, voice brain, wake word.
  STT/TTS recommended, brain/wake optional.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Headphones } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import VramBar from "../components/VramBar.svelte";
import BrowseLocalPopup from "../popups/BrowseLocalPopup.svelte";
import { SlotCard } from "../popups/index.js";
import SearchHfPopup from "../popups/SearchHfPopup.svelte";

const VOICE_SLOTS: SlotId[] = ["voice.stt", "voice.tts", "voice.brain", "voice.wake"];
const SLOT_CAPABILITIES: Record<string, string> = {
	"voice.stt": "SpeechToText",
	"voice.tts": "TextToSpeech",
	"voice.brain": "TextGeneration",
	"voice.wake": "SpeechToText",
};
const OPTIONAL_SLOTS = new Set(["voice.brain", "voice.wake"]);

interface Props {
	onContinue: () => void;
	onBack: () => void;
}

let { onContinue, onBack }: Props = $props();

let browseSlot = $state<SlotId | null>(null);
let searchSlot = $state<SlotId | null>(null);

function slotData(slotId: SlotId) {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	const model = slot?.assigned_model_id
		? (modelsState.models.find((m) => m.id === slot.assigned_model_id) ?? null)
		: null;
	return { slot, model };
}
</script>

<div class="role-step">
	<div class="role-header" style:border-left-color="var(--accent-coral-main)">
		<Headphones size={24} />
		<div class="role-info">
			<Heading level={3} size="lg">Voice</Heading>
			<Text size="sm" class="role-desc">Speech-to-text, text-to-speech, and live voice conversation. STT and TTS are recommended — brain and wake word are optional.</Text>
		</div>
	</div>

	<div class="rec-banners">
		<div class="rec-item">
			<Text size="xs" weight="bold">voice.stt</Text>
			<Text size="xs" class="rec-text">Recommended: Whisper Small (466 MB, CPU)</Text>
		</div>
		<div class="rec-item">
			<Text size="xs" weight="bold">voice.tts</Text>
			<Text size="xs" class="rec-text">Recommended: Kokoro v1.0 int8 (310 MB, CPU)</Text>
		</div>
		<div class="rec-item">
			<Text size="xs" weight="bold">voice.brain</Text>
			<Text size="xs" class="rec-text">Optional: Moshi 7B q8 (8 GB, GPU) — full-duplex STS for 16GB+ systems</Text>
		</div>
	</div>

	<VramBar />

	<div class="slot-grid">
		{#each VOICE_SLOTS as slotId (slotId)}
			{@const { slot, model } = slotData(slotId)}
			{#if slot}
				<SlotCard
					{slot}
					{model}
					optional={OPTIONAL_SLOTS.has(slotId)}
					onBrowseLocal={() => (browseSlot = slotId)}
					onSearchHF={() => (searchSlot = slotId)}
				/>
			{/if}
		{/each}
	</div>

	<div class="step-nav">
		<Button preset="button-ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		<Button preset="button-primary" size="md" onclick={onContinue}>
			Continue
			<ArrowRight size={14} />
		</Button>
	</div>
</div>

{#if browseSlot}
	<BrowseLocalPopup
		slotId={browseSlot}
		capability={SLOT_CAPABILITIES[browseSlot] ?? "SpeechToText"}
		open={true}
		onSelect={() => { browseSlot = null; void modelsState.refresh(); }}
		onClose={() => (browseSlot = null)}
	/>
{/if}

{#if searchSlot}
	<SearchHfPopup
		slotId={searchSlot}
		capability={SLOT_CAPABILITIES[searchSlot] ?? "SpeechToText"}
		open={true}
		onDownloadStarted={() => {}}
		onClose={() => (searchSlot = null)}
	/>
{/if}

<style>
	.role-step {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		max-width: 42rem;
		padding: 1rem 0;
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--accent-coral-main);
		color: var(--text-primary);
	}

	.role-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	:global(.role-desc) {
		color: var(--text-secondary);
	}

	.slot-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 0.75rem;
	}

	.rec-banners {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.rec-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: color-mix(in oklch, var(--accent-coral-fill, var(--surface-raised)) 60%, transparent);
		border: 0.0625rem solid var(--border-soft);
	}

	:global(.rec-text) {
		color: var(--text-secondary);
	}

	.step-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
	}
</style>
