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
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import {
	AlertTriangle,
	ArrowLeft,
	ArrowRight,
	Brain,
	Check,
	MessageCircle,
	Mic,
	Play,
	RotateCcw,
	Send,
	Volume2,
	X,
} from "lucide-svelte";
import { logInfo } from "$lib/sys/logger.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import {
	type PipelineStepId,
	setupWizardOverlayState,
} from "../../../data-access/setup-wizard-overlay.state.svelte.js";
import { isInferenceReady } from "../../../util/models.types.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";

let showWhyInfo = $state(false);

const overlayState = setupWizardOverlayState;

interface PipelineStepMeta {
	id: PipelineStepId;
	label: string;
	desc: string;
	icon: typeof Mic;
}

const PIPELINE_META: PipelineStepMeta[] = [
	{
		id: "stt-load",
		label: "Load speech recognizer",
		desc: "Brings the speech-to-text model into memory.",
		icon: Mic,
	},
	{
		id: "stt-test",
		label: "Mic check",
		desc: "Captures a half-second sample and confirms the mic is reachable.",
		icon: Mic,
	},
	{
		id: "brain-test",
		label: "Brain response",
		desc: "Asks the brain a one-line question and waits for a reply.",
		icon: Brain,
	},
	{
		id: "tts-load",
		label: "Load voice synthesizer",
		desc: "Brings the text-to-speech model into memory.",
		icon: Volume2,
	},
	{
		id: "tts-test",
		label: "Speak it back",
		desc: "Plays a short phrase through your speakers.",
		icon: Volume2,
	},
];

function pipelineMetaFor(id: PipelineStepId): PipelineStepMeta {
	const meta = PIPELINE_META.find((m) => m.id === id);
	if (!meta) throw new Error(`Missing pipeline meta: ${id}`);
	return meta;
}

async function handleRunPipeline(): Promise<void> {
	logInfo("wizard.validate", "Run pipeline test clicked");
	await overlayState.runPipelineTest();
}

function handleResetPipeline(): void {
	logInfo("wizard.validate", "Reset pipeline test clicked");
	overlayState.resetPipelineTest();
}

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
			<Badge variant={brainReady ? "positive" : "neutral"} size="sm">{brainStatusLabel}</Badge>
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
				<Button variant="secondary" size="sm" onclick={handleBack}>
					<ArrowLeft size={14} />
					Back to Config
				</Button>
				<Button variant="ghost" size="sm" onclick={() => (showWhyInfo = true)}>
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
				<Button variant="secondary" size="sm" onclick={handleBack}>
					<ArrowLeft size={14} />
					Back to Config
				</Button>
				<Button variant="ghost" size="sm" onclick={() => (showWhyInfo = true)}>
					Why activate separately?
				</Button>
			</div>
			<Text size="xs" color="muted">Current status: {brainStatusLabel}</Text>
		</div>
	{:else}
		<!-- ── Full pipeline test (5-step end-to-end voice + brain check) ── -->
		<div class="v-pipeline">
			<div class="v-pipeline-head">
				<Play size={16} />
				<div class="v-pipeline-head-text">
					<Text size="sm" weight="bold">Full pipeline test</Text>
					<Text size="xs" color="muted">
						End-to-end voice check: load STT → mic → brain → load TTS → speak. Each step
						runs a real call. Pass all five and Continue unlocks instantly.
					</Text>
				</div>
				{#if overlayState.pipelineAllDone}
					{#if overlayState.pipelineFailCount === 0}
						<Badge variant="positive" size="sm">All passed</Badge>
					{:else}
						<Badge variant="notice" size="sm">
							{overlayState.pipelinePassCount} of {overlayState.pipelineSteps.length} passed
						</Badge>
					{/if}
				{/if}
			</div>

			<ul class="v-pipeline-steps">
				{#each overlayState.pipelineSteps as step (step.id)}
					{@const meta = pipelineMetaFor(step.id)}
					{@const Icon = meta.icon}
					<li
						class="v-pipeline-step"
						class:v-step-pass={step.status === "pass"}
						class:v-step-fail={step.status === "fail"}
						class:v-step-running={step.status === "running"}
					>
						<div class="v-step-icon">
							{#if step.status === "running"}
								<Spinner size="xs" tone="accent" />
							{:else if step.status === "pass"}
								<Check size={14} />
							{:else if step.status === "fail"}
								<X size={14} />
							{:else}
								<Icon size={14} />
							{/if}
						</div>
						<div class="v-step-info">
							<Text size="xs" weight="bold">{meta.label}</Text>
							<Text size="xs" color="muted">{meta.desc}</Text>
							{#if step.error}
								<Text size="xs" class="v-step-error">{step.error}</Text>
							{/if}
						</div>
						{#if step.latencyMs > 0}
							<Text size="xs" color="muted" class="v-step-latency">{step.latencyMs}ms</Text>
						{/if}
					</li>
				{/each}
			</ul>

			<div class="v-pipeline-actions">
				<Button
					variant="primary"
					size="sm"
					onclick={handleRunPipeline}
					disabled={overlayState.pipelineRunning}
				>
					{#if overlayState.pipelineRunning}
						<Spinner size="xs" />
						Running…
					{:else if overlayState.pipelineAllDone}
						<RotateCcw size={14} />
						Run again
					{:else}
						<Play size={14} />
						Run pipeline test
					{/if}
				</Button>
				{#if overlayState.pipelineAllDone}
					<Button variant="ghost" size="sm" onclick={handleResetPipeline}>
						Reset
					</Button>
				{/if}
			</div>
		</div>

		<!-- ── Or chat with the brain (3-exchange minimum) ───────── -->
		<div class="v-or">
			<span class="v-or-line"></span>
			<Text size="xs" color="muted">or chat with the brain</Text>
			<span class="v-or-line"></span>
		</div>

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
			<Button variant="primary" size="md" onclick={handleSend} disabled={!canSend}>
				<Send size={14} />
				Send
			</Button>
		</div>
	{/if}

	<div class="v-actions">
		<Button variant="ghost" size="md" onclick={handleBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		<div class="v-actions-right">
			<button class="v-skip-link" onclick={handleSkip}>Skip test</button>
			<Button variant="primary" size="md" onclick={handleContinue} disabled={!overlayState.testChatComplete}>
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

	/* ── Pipeline test ──────────────────────────── */

	.v-pipeline {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 0.875rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
	}

	.v-pipeline-head {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.v-pipeline-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}

	.v-pipeline-steps {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
	}

	.v-pipeline-step {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
	}
	.v-pipeline-step.v-step-pass {
		border-color: color-mix(in oklch, var(--signal-success) 35%, transparent);
		background: color-mix(in oklch, var(--signal-success) 8%, var(--surface-base));
	}
	.v-pipeline-step.v-step-fail {
		border-color: color-mix(in oklch, var(--signal-error) 35%, transparent);
		background: color-mix(in oklch, var(--signal-error) 8%, var(--surface-base));
	}
	.v-pipeline-step.v-step-running {
		border-color: var(--accent-teal-main);
	}

	.v-step-icon {
		flex-shrink: 0;
		color: var(--text-muted);
	}
	.v-step-pass .v-step-icon {
		color: var(--signal-success);
	}
	.v-step-fail .v-step-icon {
		color: var(--signal-error);
	}
	.v-step-running .v-step-icon {
		color: var(--accent-teal-main);
	}

	.v-step-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
		min-width: 0;
	}
	:global(.v-step-error) {
		color: var(--signal-error);
	}
	:global(.v-step-latency) {
		flex-shrink: 0;
	}

	.v-pipeline-actions {
		display: flex;
		gap: 0.375rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.v-or {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}
	.v-or-line {
		flex: 1;
		height: 1px;
		background: var(--border-soft);
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
