<!--
  @file Customize Individual Models
  @route /model-loader/customize
  @domain models

  Slot cards grouped by role. Change button opens swap popup.
  ColdLight components. Role colors on every card.
-->
<script lang="ts">
import { ArrowLeft, Check, Search } from "lucide-svelte";
import { goto } from "$app/navigation";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	SLOT_LABELS,
	SlotCard,
	type SlotRole,
	SlotSwapPopup,
	VramBar,
	WizardHelpTip,
	WizardInfoPopup,
} from "$lib/domains/app/models/features/setup-wizard/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";

let swapSlotId = $state<string | null>(null);
let showPageHelp = $state(false);

const groups: Array<{ role: SlotRole; label: string; slots: typeof SLOT_LABELS }> = [
	{
		role: "reasoning",
		label: "Thinking",
		slots: SLOT_LABELS.filter((s) => s.role === "reasoning"),
	},
	{
		role: "observation",
		label: "Helpers",
		slots: SLOT_LABELS.filter((s) => s.role === "observation"),
	},
	{
		role: "encoder",
		label: "Understanding",
		slots: SLOT_LABELS.filter((s) => s.role === "encoder"),
	},
	{ role: "voice", label: "Voice", slots: SLOT_LABELS.filter((s) => s.role === "voice") },
];

async function handleSwapSelect(modelId: string): Promise<void> {
	if (!swapSlotId) return;
	const { toast } = await import("svelte-sonner");
	try {
		await modelsState.assign(swapSlotId, modelId);
		toast.success("Model assigned");
	} catch (e) {
		toast.error(e instanceof Error ? e.message : String(e));
	}
	swapSlotId = null;
}
</script>

<div class="customize-page">
	<Button preset="ghost" size="sm" onclick={() => goto("/model-loader/models")}>
		<ArrowLeft size={14} /> Back to Setup
	</Button>

	<Text size="xl" weight="bold">Customize Models</Text>
	<Text size="sm" color="secondary">Change individual AI models. Click "Change" on any slot.</Text>
	<div class="help-row">
		<WizardHelpTip tip="Use this page when you want a different model for one role without re-running full setup." />
		<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
			Customize tips
		</Button>
	</div>

	<div class="slot-groups">
		{#each groups as group (group.role)}
			{#if group.slots.length > 0}
				<div class="group">
					<Text size="xs" weight="bold" color="muted" class="group-label">{group.label}</Text>
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
		<Button preset="ghost" size="sm" onclick={() => goto("/model-loader/browse")}>
			<Search size={14} /> Browse or download more models
		</Button>
		<Button preset="primary" size="md" onclick={() => goto("/model-loader/models")}>
			<Check size={14} /> Done Customizing
		</Button>
	</div>

	<VramBar />
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Customize by Role"
	summary="Each role has a job. Swap models one role at a time and keep the rest stable."
	points={[
		"Thinking: chat and reasoning quality.",
		"Understanding: search and vision tasks.",
		"Voice: listening and speaking models.",
		"If performance drops, switch to a smaller model for that role.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon.png"
	onClose={() => (showPageHelp = false)}
/>

{#if swapSlotId}
	<SlotSwapPopup
		slotId={swapSlotId}
		onSelect={handleSwapSelect}
		onBrowseAll={() => { swapSlotId = null; goto("/model-loader/browse"); }}
		onClose={() => (swapSlotId = null)}
	/>
{/if}

<style>
	.customize-page {
		display: flex; flex-direction: column; gap: 1.25rem;
		width: 100%; max-width: 36rem; padding: 1rem 0;
	}
	.help-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.slot-groups { display: flex; flex-direction: column; gap: 1rem; }
	.group { display: flex; flex-direction: column; gap: 0.5rem; }
	.group-cards { display: flex; flex-direction: column; gap: 0.375rem; }
	.actions { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; }
</style>
