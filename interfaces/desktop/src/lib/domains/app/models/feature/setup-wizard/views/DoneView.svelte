<!--
  @file DoneView.svelte
  @domain models/setup-wizard

  View 5 of the 5-view setup wizard. Absorbs Step7Complete.

  Final celebration. Shows ready slots, launches into chat via
  finalizeAndClose. Owner closes wizard here — never bypassed.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import {
	ArrowLeft,
	Brain,
	Check,
	Cloud,
	Headphones,
	Image,
	Key,
	Search,
	Sparkles,
	X,
} from "lucide-svelte";
import { type ApiKeyStatus, commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import { isInferenceReady } from "../../../util/models.types.js";
import VramBar from "../components/VramBar.svelte";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { wizardState } from "../wizard.state.svelte.js";

let showSettingsInfo = $state(false);

const overlayState = setupWizardOverlayState;

// ── API key summary ─────────────────────────────────────
let apiKeyStatuses = $state<ApiKeyStatus[]>([]);
const connectedProviders = $derived(apiKeyStatuses.filter((s) => s.stored));

$effect(() => {
	void loadApiKeyStatuses();
});

async function loadApiKeyStatuses(): Promise<void> {
	logInfo("wizard.done", "loadApiKeyStatuses() → commands.getApiKeyStatus");
	try {
		const result = await commands.getApiKeyStatus();
		if (result.status === "ok") {
			apiKeyStatuses = result.data;
		} else {
			logError("wizard.done", `loadApiKeyStatuses() FAILED: ${result.error.message}`);
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		logError("wizard.done", `loadApiKeyStatuses() threw: ${msg}`);
	}
}

interface RoleSummary {
	slotId: string;
	label: string;
	icon: typeof Brain;
	accent: string;
}

const ROLE_SUMMARY: RoleSummary[] = [
	{ slotId: "chat.brain", label: "Brain", icon: Brain, accent: "var(--wizard-role-brain-main)" },
	{
		slotId: "rag.embedder",
		label: "Memory",
		icon: Search,
		accent: "var(--wizard-role-encoder-main)",
	},
	{
		slotId: "vision.encoder",
		label: "Vision",
		icon: Image,
		accent: "var(--wizard-role-encoder-main)",
	},
	{
		slotId: "voice.tts",
		label: "Voice",
		icon: Headphones,
		accent: "var(--wizard-role-voice-main)",
	},
];

function slotInfo(slotId: string) {
	const slot = modelsState.slots.find((s) => s.id === slotId);
	const model = slot?.assigned_model_id
		? modelsState.models.find((m) => m.id === slot.assigned_model_id)
		: null;
	const status = modelsState.statuses[slotId];
	const ready = status ? isInferenceReady(status) : false;
	return { slot, model, ready };
}

const assignedCount = $derived(modelsState.slots.filter((s) => !!s.assigned_model_id).length);
const totalSlots = $derived(modelsState.slots.length);

let launching = $state(false);

async function handleLaunch(): Promise<void> {
	if (launching) return;
	logInfo("wizard.done", "Start Chatting clicked");
	launching = true;
	try {
		await overlayState.finalizeAndClose(() => wizardState.close());
	} finally {
		launching = false;
	}
}

/**
 * Close without launching chat — still commits setup (markSetupComplete)
 * so the wizard does not reopen next launch, but leaves the user on the
 * current app view instead of switching to chat. Useful when finishing
 * setup mid-task.
 */
async function handleClose(): Promise<void> {
	if (launching) return;
	logInfo("wizard.done", "Close clicked (finalize + stay on current view)");
	launching = true;
	try {
		await overlayState.finalizeAndClose(() => wizardState.close());
	} finally {
		launching = false;
	}
}

function handleBack(): void {
	logInfo("wizard.done", "Back clicked");
	overlayState.showValidate();
}
</script>

<div class="done-view">
	<div class="d-header">
		<img src="/imgs/mascot/clyffy-anim-wobble.png" alt="Clyffy celebrating" class="d-mascot" />
		<Heading level={2} size="xl">You're all set</Heading>
		<Text size="sm" color="secondary">
			{assignedCount} of {totalSlots} slots configured. Everything here is editable from Settings later.
		</Text>
		<div class="d-help-row">
			<WizardHelpTip
				tip="Clicking Start Chatting marks setup complete and opens the main app. The wizard won't auto-open again unless you reset onboarding."
				label="What happens next?"
			/>
			<Button variant="ghost" size="sm" onclick={() => (showSettingsInfo = true)}>
				Change later
			</Button>
		</div>
	</div>

	<VramBar />

	<div class="d-grid">
		{#each ROLE_SUMMARY as role (role.slotId)}
			{@const info = slotInfo(role.slotId)}
			<div class="d-card" style:--role-accent={role.accent}>
				<div class="d-card-head">
					<role.icon size={18} />
					<Text size="sm" weight="bold">{role.label}</Text>
					<Badge variant={info.ready ? "positive" : "neutral"} size="sm">
						{#if info.ready}
							<Check size={10} />
							Ready
						{:else if info.model}
							Assigned
						{:else}
							Not set
						{/if}
					</Badge>
				</div>
				{#if info.model}
					<Text size="xs" color="muted">{info.model.filename}</Text>
				{:else}
					<Text size="xs" color="muted">Set this up anytime in Settings → Models.</Text>
				{/if}
			</div>
		{/each}
	</div>

	<!-- API key summary — shows which providers are connected, mirrors completion screen archive -->
	<div class="d-api-row">
		<div class="d-api-head">
			<Key size={16} />
			<Text size="sm" weight="bold">Cloud providers</Text>
			<WizardHelpTip
				tip="Optional. DevPulse runs locally without these. Connected providers are available to the escalation chain."
				label="What are these?"
			/>
		</div>
		{#if connectedProviders.length === 0}
			<Text size="xs" color="muted">
				No cloud providers connected. Local-only mode — every request stays on your machine.
				You can add keys anytime from Settings → Routing.
			</Text>
		{:else}
			<div class="d-api-chips">
				{#each connectedProviders as p (p.provider)}
					<span class="d-api-chip">
						<Cloud size={12} />
						<Text size="xs" weight="bold">{p.displayName}</Text>
						<Check size={10} />
					</span>
				{/each}
			</div>
		{/if}
	</div>

	<div class="d-actions">
		<Button variant="ghost" size="md" onclick={handleBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		<div class="d-actions-right">
			<Button variant="ghost" size="md" onclick={handleClose} disabled={launching} aria-label="Close without launching chat">
				<X size={14} />
				Close
			</Button>
			<Button variant="primary" size="lg" onclick={handleLaunch} disabled={launching}>
				<Sparkles size={16} />
				{launching ? "Launching…" : "Start Chatting"}
			</Button>
		</div>
	</div>
</div>

<WizardInfoPopup
	open={showSettingsInfo}
	title="Changing setup later"
	summary="Every decision you made in this wizard is stored locally and editable from the main app. Nothing is locked in."
	points={[
		"Settings → Profile: change your name, email, experience level.",
		"Settings → Models: swap, activate, or deactivate slots. Browse local files or search HF.",
		"Settings → Assistant: rename Clyffy, change wake phrase, voice profile, routing mode.",
		"Reset Onboarding: re-run this wizard fresh from Settings → Advanced.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showSettingsInfo = false)}
/>

<style>
	.done-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.25rem;
		width: 100%;
		max-width: 46rem;
		margin: 0 auto;
		padding: 1rem;
		text-align: center;
	}

	.d-header {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.d-help-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		flex-wrap: wrap;
		margin-top: 0.25rem;
	}

	.d-mascot {
		width: clamp(4rem, 3.5rem + 2vw, 5.5rem);
		height: clamp(4rem, 3.5rem + 2vw, 5.5rem);
		object-fit: contain;
	}

	.d-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
		gap: 0.75rem;
		width: 100%;
		text-align: left;
	}

	.d-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.875rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		border-left: 3px solid var(--role-accent, var(--text-muted));
	}

	.d-card-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--role-accent, var(--text-primary));
	}

	.d-api-row {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		text-align: left;
	}
	.d-api-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-secondary);
	}
	.d-api-chips {
		display: flex;
		gap: 0.375rem;
		flex-wrap: wrap;
	}
	.d-api-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.25rem 0.625rem;
		border-radius: 999px;
		background: color-mix(in oklch, var(--signal-success) 12%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-success) 30%, transparent);
		color: var(--signal-success);
	}

	.d-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding-top: 0.5rem;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.d-actions-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
</style>
