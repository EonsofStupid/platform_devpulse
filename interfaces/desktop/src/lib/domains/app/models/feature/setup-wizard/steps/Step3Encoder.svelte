<!--
  @file Step-3-Encoder.svelte
  Search, understanding, and vision models.
  Slots: rag.embedder, rag.reranker, rag.encoder, vision.embedder.
  All optional — user can skip.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Search } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import type { SlotId } from "../../../util/models.types.js";
import VramBar from "../components/VramBar.svelte";
import BrowseLocalPopup from "../popups/BrowseLocalPopup.svelte";
import { SlotCard } from "../popups/index.js";
import SearchHfPopup from "../popups/SearchHfPopup.svelte";

const ENCODER_SLOTS: SlotId[] = ["rag.embedder", "rag.reranker", "rag.encoder", "vision.embedder"];
const SLOT_CAPABILITIES: Record<string, string> = {
	"rag.embedder": "Embedding",
	"rag.reranker": "Reranking",
	"rag.encoder": "Embedding",
	"vision.embedder": "VisionEmbedding",
};

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
	<div class="role-header" style:border-left-color="var(--accent-purple-main)">
		<Search size={24} />
		<div class="role-info">
			<Heading level={3} size="lg">Encoder</Heading>
			<Text size="sm" class="role-desc">Search, understanding, and vision. These models help Clyffy find and understand your code, docs, and screenshots.</Text>
		</div>
	</div>

	<VramBar />

	<div class="slot-grid">
		{#each ENCODER_SLOTS as slotId (slotId)}
			{@const { slot, model } = slotData(slotId)}
			{#if slot}
				<SlotCard
					{slot}
					{model}
					optional
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
		capability={SLOT_CAPABILITIES[browseSlot] ?? "Embedding"}
		open={true}
		onSelect={() => { browseSlot = null; void modelsState.refresh(); }}
		onClose={() => (browseSlot = null)}
	/>
{/if}

{#if searchSlot}
	<SearchHfPopup
		slotId={searchSlot}
		capability={SLOT_CAPABILITIES[searchSlot] ?? "Embedding"}
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
		border-left: 3px solid var(--accent-purple-main);
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

	.step-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
	}
</style>
