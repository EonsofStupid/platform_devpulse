<!--
  @file CompletionStep.svelte
  Canonical completion step for both overlay and route entrypoints.
  Summarizes readiness and marks onboarding complete on launch.
-->
<script lang="ts">
import { Brain, Check, Cloud, Eye, Key, Search, Volume2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import {
	formatMb,
	hardwareState,
	isInferenceReady,
	modelsState,
} from "$lib/domains/app/models/index.js";
import { type ApiKeyStatus, commands } from "$lib/sys/generated/bindings.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { markOnboardingComplete } from "../wizard.service.js";
import { ROLE_COLORS, SLOT_LABELS } from "../wizard.types.js";

interface Props {
	onComplete?: () => void;
}

let { onComplete }: Props = $props();
let showPageHelp = $state(false);

const slotSummary = $derived(
	SLOT_LABELS.map((sl) => {
		const slot = modelsState.userSlots.find((s) => s.id === sl.id);
		const model = slot?.assigned_model_id
			? modelsState.models.find((m) => m.id === slot.assigned_model_id)
			: null;
		const status = modelsState.statuses[sl.id] ?? { type: "cold" as const };
		const ready = isInferenceReady(status);
		const color = ROLE_COLORS[sl.role];
		return { ...sl, model, ready, color };
	}),
);
const readyCount = $derived(slotSummary.filter((s) => s.ready).length);
const assignedCount = $derived(slotSummary.filter((s) => s.model).length);

let apiKeys = $state<ApiKeyStatus[]>([]);
$effect(() => {
	commands.getApiKeyStatus().then((result) => {
		if (result.status === "ok") apiKeys = result.data as ApiKeyStatus[];
	});
});

function roleIcon(role: string): typeof Brain {
	switch (role) {
		case "reasoning":
			return Brain;
		case "observation":
			return Eye;
		case "encoder":
			return Search;
		case "voice":
			return Volume2;
		default:
			return Brain;
	}
}

async function handleLaunch(): Promise<void> {
	await markOnboardingComplete();
	onComplete?.();
}
</script>

<div class="complete-page">
	<div class="help-row">
		<WizardHelpTip tip="Review each role here before launch. You can still edit later from settings." />
		<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
			Read summary
		</Button>
	</div>
	<img src="/imgs/mascot/clyffy-anim-wobble.png" alt="Clyffy celebrating" class="mascot-celebrate" />

	<Text size="2xl" weight="bold">You're All Set!</Text>
	<Text size="base" color="secondary">
		{readyCount} of {slotSummary.length} capabilities ready. {assignedCount} models assigned.
	</Text>

	<div class="summary">
		{#each slotSummary as s (s.id)}
			{@const Icon = roleIcon(s.role)}
			<div class="summary-row">
				<span class="summary-dot" style="background: {s.ready ? s.color.accent : s.model ? 'var(--color-brand-gold-500)' : 'var(--color-void-600)'};"></span>
				<Icon size={14} style="color: {s.color.accent};" />
				<span class="summary-label">{s.name}</span>
				<span class="summary-model">{s.model?.filename ?? "Not assigned"}</span>
				<Badge preset={s.ready ? "glass" : "default"}>
					{s.ready ? "Ready" : s.model ? "Assigned" : "Empty"}
				</Badge>
			</div>
		{/each}
	</div>

	<div class="api-section">
		<div class="api-header"><Key size={14} /> <Text size="sm" weight="semibold">Cloud AI</Text></div>
		{#if apiKeys.filter((k) => k.stored).length > 0}
			{#each apiKeys.filter((k) => k.stored) as prov (prov.provider)}
				<div class="summary-row">
					<span class="summary-dot" style="background: var(--accent-green-main);"></span>
					<Cloud size={14} />
					<span class="summary-label">{prov.provider}</span>
					<span class="summary-model">{prov.masked_preview ?? "Connected"}</span>
					<Badge preset="glass">Ready</Badge>
				</div>
			{/each}
		{:else}
			<Text size="sm" color="muted">No API keys configured. Clyffy runs fully local. Add keys anytime in Settings.</Text>
		{/if}
	</div>

	{#if hardwareState.hasGpu}
		<Text size="sm" color="muted">GPU: {hardwareState.gpuName} — {formatMb(hardwareState.vramFreeMb ?? 0)} VRAM free</Text>
	{/if}

	<Button preset="primary" size="lg" onclick={handleLaunch}>
		<Check size={18} /> Launch DevPulse
	</Button>

	<Text size="sm" color="muted">You can change models anytime from Settings.</Text>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="What 'Ready' Means"
	summary="A role is ready when a compatible model is assigned and loaded for use."
	points={[
		"Ready: assigned and active.",
		"Assigned: selected but not yet active.",
		"Empty: no model chosen for that role.",
		"Voice and vision can be added later if skipped now.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.complete-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		padding: 2rem;
		text-align: center;
	}
	.help-row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	.mascot-celebrate {
		width: 5rem;
		height: 5rem;
		object-fit: contain;
		filter: drop-shadow(var(--drop-shadow-teal));
		animation: bounce 600ms ease-in-out;
	}
	@keyframes bounce {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-0.5rem); }
	}
	.summary {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
		max-width: 30rem;
		text-align: left;
	}
	.summary-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}
	.summary-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full);
		flex-shrink: 0;
	}
	.summary-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		width: 8rem;
	}
	.summary-model {
		flex: 1;
		font-size: 0.875rem;
		color: var(--text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.api-section {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		width: 100%;
		max-width: 30rem;
		text-align: left;
	}
	.api-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
</style>
