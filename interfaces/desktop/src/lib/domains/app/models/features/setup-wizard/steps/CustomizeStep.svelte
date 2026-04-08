<!--
  @file CustomizeStep.svelte
  Commandment #1: One decision per screen — each slot is its own card.
  Commandment #6: "Change" opens SlotSwapPopup with 2-4 options.
  Grouped by role. VramBar at bottom.
-->
<script lang="ts">
import { ArrowLeft, Check, Search } from "lucide-svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import SlotCard from "../components/SlotCard.svelte";
import SlotSwapPopup from "../components/SlotSwapPopup.svelte";
import VramBar from "../components/VramBar.svelte";
import { SLOT_LABELS, type SlotRole } from "../wizard.types.js";

interface Props {
	onBack: () => void;
	onBrowse: () => void;
	onDone: () => void;
}
let { onBack, onBrowse, onDone }: Props = $props();

let swapSlotId = $state<string | null>(null);

/** Group slots by role for visual grouping. */
const groups: Array<{ role: SlotRole; label: string; slots: typeof SLOT_LABELS }> = [
	{
		role: "reasoning",
		label: "Thinking",
		slots: SLOT_LABELS.filter((s) => s.role === "reasoning"),
	},
	{
		role: "observation",
		label: "Watching",
		slots: SLOT_LABELS.filter((s) => s.role === "observation"),
	},
	{
		role: "encoder",
		label: "Understanding",
		slots: SLOT_LABELS.filter((s) => s.role === "encoder"),
	},
	{ role: "voice", label: "Talking", slots: SLOT_LABELS.filter((s) => s.role === "voice") },
];

async function handleSwapSelect(modelId: string): Promise<void> {
	if (!swapSlotId) return;
	const { toast } = await import("svelte-sonner");
	try {
		await modelsState.assign(swapSlotId, modelId);
		toast.success("Model assigned");
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		toast.error(`Failed: ${msg}`);
	}
	swapSlotId = null;
}
</script>

<div class="customize-step">
	<div class="step-header">
		<button class="btn-back" onclick={onBack}><ArrowLeft size={14} /> Back to Setup</button>
		<h2 class="step-title">Customize Models</h2>
		<p class="step-desc">Change individual AI models. Click "Change" on any slot to pick a different model.</p>
	</div>

	<div class="slot-groups">
		{#each groups as group (group.role)}
			{#if group.slots.length > 0}
				<div class="group">
					<h3 class="group-label">{group.label}</h3>
					<div class="group-cards">
						{#each group.slots as sl (sl.id)}
							<SlotCard slotId={sl.id} onChange={() => (swapSlotId = sl.id)} />
						{/each}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<div class="actions">
		<button class="btn-browse" onclick={onBrowse}>
			<Search size={14} /> Browse or download more models
		</button>
		<button class="btn-done" onclick={onDone}>
			<Check size={14} /> Done Customizing
		</button>
	</div>

	<VramBar />
</div>

<!-- Swap popup (Commandment #6) -->
{#if swapSlotId}
	<SlotSwapPopup
		slotId={swapSlotId}
		onSelect={handleSwapSelect}
		onBrowseAll={onBrowse}
		onClose={() => (swapSlotId = null)}
	/>
{/if}

<style>
	.customize-step {
		display: flex; flex-direction: column; gap: 1.25rem;
		width: 100%; max-width: 36rem; padding: 1rem 0;
	}
	.step-header { display: flex; flex-direction: column; gap: 0.375rem; }
	.step-title { font-size: 1.25rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.step-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; }

	.btn-back {
		display: inline-flex; align-items: center; gap: 0.25rem; align-self: flex-start;
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-xs); cursor: pointer; padding: 0; margin-bottom: 0.25rem;
	}
	.btn-back:hover { color: var(--wiz-cyan); }

	.slot-groups { display: flex; flex-direction: column; gap: 1rem; }
	.group { display: flex; flex-direction: column; gap: 0.5rem; }
	.group-label {
		font-size: var(--wiz-text-xs); font-weight: 700; color: var(--wiz-text-muted);
		text-transform: uppercase; letter-spacing: 0.05em; margin: 0;
	}
	.group-cards { display: flex; flex-direction: column; gap: 0.375rem; }

	.actions { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
	.btn-browse {
		display: inline-flex; align-items: center; gap: 0.25rem;
		border: none; background: transparent; color: var(--wiz-text-muted);
		font-size: var(--wiz-text-xs); cursor: pointer;
	}
	.btn-browse:hover { color: var(--wiz-cyan); }
	.btn-done {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1.25rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer;
	}
	.btn-done:hover { filter: brightness(1.15); }
</style>
