<!--
  @file CustomizeStep.svelte
  Canonical per-role customization step.
  Restores help affordances and route labels while removing legacy wizard-scoped styling.
-->
<script lang="ts">
import { ArrowLeft, Check, Search } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import SlotCard from "../components/SlotCard.svelte";
import SlotSwapPopup from "../components/SlotSwapPopup.svelte";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { SLOT_LABELS, type SlotRole } from "../wizard.types.js";

interface Props {
	onBack: () => void;
	onBrowse: () => void;
	onDone: () => void;
}

let { onBack, onBrowse, onDone }: Props = $props();

let swapSlotId = $state<string | null>(null);
let showPageHelp = $state(false);

const groups: Array<{ role: SlotRole; label: string; slots: typeof SLOT_LABELS }> = [
	{
		role: "reasoning",
		label: "Thinking",
		slots: SLOT_LABELS.filter((slot) => slot.role === "reasoning"),
	},
	{
		role: "observation",
		label: "Helpers",
		slots: SLOT_LABELS.filter((slot) => slot.role === "observation"),
	},
	{
		role: "encoder",
		label: "Understanding",
		slots: SLOT_LABELS.filter((slot) => slot.role === "encoder"),
	},
	{ role: "voice", label: "Voice", slots: SLOT_LABELS.filter((slot) => slot.role === "voice") },
];

async function handleSwapSelect(modelId: string): Promise<void> {
	if (!swapSlotId) return;
	const { toast } = await import("svelte-sonner");
	try {
		await modelsState.assign(swapSlotId, modelId);
		toast.success("Model assigned");
	} catch (error) {
		toast.error(error instanceof Error ? error.message : String(error));
	}
	swapSlotId = null;
}
</script>

<div class="customize-step">
	<header class="step-header">
		<Button preset="ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} /> Back to Setup
		</Button>
		<Text size="xl" weight="bold">Customize Models</Text>
		<Text size="sm" class="step-subtitle">Change one role at a time without rebuilding the whole plan.</Text>
		<div class="help-row">
			<WizardHelpTip tip="Use this page when you want a different model for one role without rerunning full setup." />
			<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
				Customize tips
			</Button>
		</div>
	</header>

	<div class="slot-groups">
		{#each groups as group (group.role)}
			{#if group.slots.length > 0}
				<section class="group">
					<Text size="xs" weight="bold" class="group-label">{group.label}</Text>
					<div class="group-cards">
						{#each group.slots as slot (slot.id)}
							<SlotCard slotId={slot.id} onChange={() => (swapSlotId = slot.id)} />
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	</div>

	<div class="actions">
		<Button preset="ghost" size="sm" onclick={onBrowse}>
			<Search size={14} /> Browse or download more models
		</Button>
		<Button preset="primary" size="md" onclick={onDone}>
			<Check size={14} /> Done Customizing
		</Button>
	</div>

	<VramBar />
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Customize by role"
	summary="Each role has a job. Swap one role at a time and keep the rest of the setup stable."
	points={[
		"Thinking: the main coding and reasoning models.",
		"Helpers: supporting roles that reduce pressure on the main brain.",
		"Understanding: memory search and vision-related models.",
		"Voice: listening and speaking roles you can keep optional if needed.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon.png"
	onClose={() => (showPageHelp = false)}
/>

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
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 0.75rem + 1vw, 1.5rem);
		width: 100%;
		max-width: 38rem;
		padding: clamp(1rem, 0.75rem + 1vw, 1.5rem) 0;
	}

	.step-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.step-subtitle) {
		color: var(--text-secondary);
	}

	.help-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	.slot-groups {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	:global(.group-label) {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.group-cards {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
</style>
