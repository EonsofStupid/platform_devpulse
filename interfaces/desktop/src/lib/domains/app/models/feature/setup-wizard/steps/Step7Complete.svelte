<!--
  @file Step-7-Complete.svelte
  Summary and launch. Shows assigned models per role, VRAM estimate, launch CTA.
  Absorbs: CompletionStep (summary grid, API section, launch button).
-->
<script lang="ts">
import { ArrowLeft, Brain, Check, Headphones, Search, Sparkles } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { isInferenceReady } from "../../../util/models.types.js";
import VramBar from "../components/VramBar.svelte";
import { markOnboardingComplete } from "../wizard.service.js";
import { wizardState } from "../wizard.state.svelte.js";
import { getSlotLabel, ROLE_COLORS, ROLE_FRAMES, SLOT_LABELS } from "../wizard.types.js";

interface Props {
	onFinish: () => void;
}

let { onFinish }: Props = $props();
let launching = $state(false);

const ROLE_ICONS = {
	brain: Brain,
	encoder: Search,
	voice: Headphones,
	helpers: Sparkles,
} as const;

const ROLE_ACCENT_VARS: Record<string, string> = {
	brain: "var(--accent-teal-main)",
	encoder: "var(--accent-purple-main)",
	voice: "var(--accent-coral-main)",
	helpers: "var(--text-muted)",
};

function slotSummary(slotId: string) {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	const model = slot?.assigned_model_id
		? modelsState.models.find((m) => m.id === slot.assigned_model_id)
		: null;
	const status = modelsState.statuses[slotId];
	const ready = status ? isInferenceReady(status) : false;
	const label = getSlotLabel(slotId);
	return { slot, model, ready, label };
}

const assignedCount = $derived(modelsState.slots.filter((s) => !!s.assigned_model_id).length);
const totalSlots = $derived(modelsState.slots.length);

async function handleLaunch(): Promise<void> {
	launching = true;
	try {
		await markOnboardingComplete();
		wizardState.close();
		onFinish();
	} catch (e) {
		console.error("Launch failed:", e);
		// Still close — non-fatal
		wizardState.close();
		onFinish();
	} finally {
		launching = false;
	}
}
</script>

<div class="complete-step">
	<div class="complete-header">
		<img src="/imgs/mascot/clyffy-anim-wobble.png" alt="Clyffy celebrating" class="complete-mascot" />
		<Heading level={2} size="xl">You're all set!</Heading>
		<Text size="sm" class="complete-subtitle">
			{assignedCount} of {totalSlots} slots configured. You can change models anytime from Settings.
		</Text>
	</div>

	<VramBar />

	<div class="role-summary-grid">
		{#each ROLE_FRAMES as frame (frame.id)}
			{@const Icon = ROLE_ICONS[frame.id as keyof typeof ROLE_ICONS] ?? Sparkles}
			{@const accent = ROLE_ACCENT_VARS[frame.id] ?? "var(--text-muted)"}
			<div class="role-summary-card" style:border-left-color={accent}>
				<div class="role-card-header">
					<Icon size={18} />
					<Text size="sm" weight="bold">{frame.label}</Text>
				</div>
				<div class="role-slots">
					{#each frame.slots as slotId (slotId)}
						{@const { model, ready, label } = slotSummary(slotId)}
						<div class="slot-row">
							<Text size="xs" class="slot-name">{label?.name ?? slotId}</Text>
							{#if model}
								<Text size="xs" class="slot-model">{model.filename}</Text>
								<Badge tone={ready ? "positive" : "neutral"} size="sm">
									{#if ready}<Check size={8} />{/if}
									{ready ? "Ready" : "Assigned"}
								</Badge>
							{:else}
								<Text size="xs" class="slot-empty">Not set up</Text>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<Button preset="button-primary" size="lg" onclick={handleLaunch} disabled={launching}>
		{#if launching}
			<Sparkles size={18} />
			Launching...
		{:else}
			<Sparkles size={18} />
			Start Using DevPulse
		{/if}
	</Button>
</div>

<style>
	.complete-step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
		max-width: 42rem;
		padding: 1rem 0;
		text-align: center;
	}

	.complete-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.complete-mascot {
		width: clamp(4rem, 3.5rem + 2vw, 5.5rem);
		height: clamp(4rem, 3.5rem + 2vw, 5.5rem);
		object-fit: contain;
	}

	:global(.complete-subtitle) {
		color: var(--text-secondary);
		max-width: 28rem;
	}

	.role-summary-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
		gap: 0.75rem;
		width: 100%;
		text-align: left;
	}

	.role-summary-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--text-muted);
	}

	.role-card-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-primary);
	}

	.role-slots {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.slot-row {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-wrap: wrap;
	}

	:global(.slot-name) {
		font-weight: 600;
		color: var(--text-secondary);
		min-width: 5rem;
	}

	:global(.slot-model) {
		font-family: var(--font-mono);
		color: var(--text-muted);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	:global(.slot-empty) {
		color: var(--text-muted);
		font-style: italic;
	}
</style>
