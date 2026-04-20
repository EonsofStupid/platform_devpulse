<!--
  @file ValidateView.svelte
  @domain models/setup-wizard

  View 4 of the 5-view setup wizard. Absorbs Step6Activate.

  Test chat with the assigned chat.brain slot to validate it actually
  works before finalising setup. 3-exchange minimum, or skip.

  Reads test chat state + actions from setupWizardOverlayState.
  ModelLoaderPanel handles load state display via LoadStageOverlay
  (mounted by the root overlay) — this view just reads brainReady
  and sends test messages.
-->
<script lang="ts">
import { AlertTriangle, ArrowLeft, ArrowRight, Check, MessageCircle, Send } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { logInfo } from "$lib/sys/logger.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { setupWizardOverlayState } from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import { isInferenceReady } from "../../../util/models.types.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";

let showWhyInfo = $state(false);

const overlayState = setupWizardOverlayState;

const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const brainSlot = $derived(modelsState.slots.find((s) => s.id === "chat.brain"));
const hasBrain = $derived(Boolean(brainSlot?.assigned_model_id));
const brainReady = $derived(brainStatus ? isInferenceReady(brainStatus) : false);
const brainStatusLabel = $derived(
	!hasBrain
		? "No brain assigned"
		: brainStatus?.type === "loading"
			? "Loading…"
			: brainStatus?.type === "hot"
				? "Ready"
				: brainStatus?.type === "warm"
					? "Warming"
					: brainStatus?.type === "failed"
						? "Failed"
						: "Not loaded",
);

const canSend = $derived(
	brainReady && overlayState.testChatInput.trim().length > 0 && !overlayState.testChatSending,
);

async function handleSend(): Promise<void> {
	logInfo("wizard.validate", "Send clicked");
	await overlayState.sendTestMessage();
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		void handleSend();
	}
}

function handleContinue(): void {
	logInfo("wizard.validate", "Continue clicked");
	overlayState.advanceFromValidate();
}

function handleSkip(): void {
	logInfo("wizard.validate", "Skip clicked");
	overlayState.skipTestChat();
}

function handleBack(): void {
	logInfo("wizard.validate", "Back clicked");
	overlayState.showConfig();
}
</script>

<div class="validate-view">
	<div class="v-header">
		<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy" class="v-mascot" />
		<div class="v-title">
			<Heading level={2} size="lg">Test Clyffy's Brain</Heading>
			<Text size="sm" color="secondary">
				Have a short chat to verify the brain actually responds. {overlayState.requiredExchanges} exchanges minimum.
			</Text>
		</div>
		<div class="v-title-help">
			<WizardHelpTip
				tip="This step uses the model you assigned + activated on the Brain card. If it's still loading, wait for the spinner in the bottom-right to finish."
				label="Why this test?"
			/>
			<Badge tone={brainReady ? "positive" : "neutral"} size="sm">{brainStatusLabel}</Badge>
		</div>
	</div>

	{#if !hasBrain}
		<div class="v-card v-warn">
			<div class="v-card-head">
				<AlertTriangle size={18} />
				<Text size="sm" weight="bold">No brain model assigned</Text>
			</div>
			<Text size="xs" color="muted">
				Go back to Config and pick a model for the Brain card. Browse your local models or
				download a recommended one, then click Activate to load it.
			</Text>
			<div class="v-card-actions">
				<Button preset="button-secondary" size="sm" onclick={handleBack}>
					<ArrowLeft size={14} />
					Back to Config
				</Button>
				<Button preset="button-ghost" size="sm" onclick={() => (showWhyInfo = true)}>
					Why this is required
				</Button>
			</div>
		</div>
	{:else if !brainReady}
		<div class="v-card v-warn">
			<div class="v-card-head">
				<AlertTriangle size={18} />
				<Text size="sm" weight="bold">Brain is not loaded yet</Text>
			</div>
			<Text size="xs" color="muted">
				You assigned a brain model but haven't activated it. Go back to Config and click
				Activate on the Brain card. The LoadStage overlay will appear in the bottom-right
				with the current stage (reading file → allocating memory → warming up → ready).
			</Text>
			<div class="v-card-actions">
				<Button preset="button-secondary" size="sm" onclick={handleBack}>
					<ArrowLeft size={14} />
					Back to Config
				</Button>
				<Button preset="button-ghost" size="sm" onclick={() => (showWhyInfo = true)}>
					Why activate separately?
				</Button>
			</div>
			<Text size="xs" color="muted">Current status: {brainStatusLabel}</Text>
		</div>
	{:else}
		<div class="v-progress">
			{#each Array(overlayState.requiredExchanges) as _, i (i)}
				<div
					class="v-dot"
					class:v-dot-filled={overlayState.testChatExchanges > i}
				>
					{#if overlayState.testChatExchanges > i}
						<Check size={10} />
					{:else}
						{i + 1}
					{/if}
				</div>
			{/each}
			<Text size="xs" color="muted">
				{#if overlayState.testChatComplete}
					All checks passed
				{:else}
					{overlayState.testChatExchanges}/{overlayState.requiredExchanges} exchanges
				{/if}
			</Text>
		</div>

		<div class="v-chat">
			{#if overlayState.testChatMessages.length === 0}
				<div class="v-chat-empty">
					<MessageCircle size={22} />
					<Text size="sm" color="muted">Say hello to Clyffy to start.</Text>
				</div>
			{/if}

			{#each overlayState.testChatMessages as msg, i (i)}
				<div class="v-bubble v-bubble-{msg.role}">
					<Text size="sm">{msg.content}</Text>
				</div>
			{/each}

			{#if overlayState.testChatSending}
				<div class="v-bubble v-bubble-assistant">
					<Spinner size="xs" tone="accent" />
					<Text size="xs" color="muted">Clyffy is thinking…</Text>
				</div>
			{/if}
		</div>

		<div class="v-input-row">
			<input
				type="text"
				class="v-input"
				placeholder="Type a message…"
				bind:value={overlayState.testChatInput}
				onkeydown={handleKeydown}
				disabled={!brainReady || overlayState.testChatSending}
			/>
			<Button preset="button-primary" size="md" onclick={handleSend} disabled={!canSend}>
				<Send size={14} />
				Send
			</Button>
		</div>
	{/if}

	<div class="v-actions">
		<Button preset="button-ghost" size="md" onclick={handleBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		<div class="v-actions-right">
			<button class="v-skip-link" onclick={handleSkip}>Skip test</button>
			<Button preset="button-primary" size="md" onclick={handleContinue} disabled={!overlayState.testChatComplete}>
				Continue
				<ArrowRight size={14} />
			</Button>
		</div>
	</div>
</div>

<WizardInfoPopup
	open={showWhyInfo}
	title="Why activate models per-slot?"
	summary="DevPulse mirrors JanAI and LM Studio: you choose a model, then explicitly activate it. No surprise GPU allocations, no batch loads that freeze the UI."
	points={[
		"Choose: pick a model in the card (Browse local or Search HF).",
		"Install: download if needed (shows real-time progress).",
		"Activate: load the chosen model into GPU/CPU. LoadStage overlay narrates the stages.",
		"Deactivate: free GPU memory when you don't need a slot.",
		"This validate step only works once the Brain slot is Active — then we chat with it live.",
	]}
	imageSrc="/imgs/mascot/clyffy-df-icon-interaction1.png"
	onClose={() => (showWhyInfo = false)}
/>

<style>
	.validate-view {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		width: 100%;
		max-width: 48rem;
		margin: 0 auto;
		padding: 1rem;
	}

	.v-header {
		display: flex;
		align-items: center;
		gap: 0.875rem;
	}

	.v-mascot {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
		flex-shrink: 0;
	}

	.v-title {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.v-title-help {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
	}

	.v-card {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1.25rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		text-align: left;
	}

	.v-card-head {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.v-card-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.v-warn {
		border-color: color-mix(in oklch, var(--signal-warning) 35%, transparent);
		background: color-mix(in oklch, var(--signal-warning) 8%, var(--surface-raised));
	}
	.v-warn .v-card-head {
		color: var(--signal-warning);
	}

	.v-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.v-dot {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.625rem;
		font-weight: 700;
		border: 1px solid var(--border-soft);
		color: var(--text-muted);
		background: var(--surface-raised);
		transition: all 300ms ease-out;
	}
	.v-dot-filled {
		background: color-mix(in oklch, var(--wizard-role-minion-main) 20%, transparent);
		border-color: var(--wizard-role-minion-main);
		color: var(--wizard-role-minion-main);
	}

	.v-chat {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 10rem;
		max-height: 22rem;
		overflow-y: auto;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
	}

	.v-chat-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex: 1;
		min-height: 6rem;
		color: var(--text-muted);
	}

	.v-bubble {
		max-width: 80%;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		word-break: break-word;
	}
	.v-bubble-user {
		align-self: flex-end;
		background: color-mix(in oklch, var(--wizard-role-brain-fill) 80%, transparent);
		border: 1px solid color-mix(in oklch, var(--wizard-role-brain-main) 25%, transparent);
	}
	.v-bubble-assistant {
		align-self: flex-start;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
	}
	.v-bubble-error {
		align-self: center;
		background: color-mix(in oklch, var(--signal-error) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);
		color: var(--signal-error);
	}

	.v-input-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.v-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-raised);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
	}
	.v-input:focus {
		border-color: var(--wizard-role-brain-main);
	}
	.v-input:disabled {
		opacity: 0.5;
	}

	.v-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
		gap: 0.5rem;
	}

	.v-actions-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.v-skip-link {
		background: none;
		border: none;
		padding: 0;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
	}
	.v-skip-link:hover {
		color: var(--text-secondary);
	}
</style>
