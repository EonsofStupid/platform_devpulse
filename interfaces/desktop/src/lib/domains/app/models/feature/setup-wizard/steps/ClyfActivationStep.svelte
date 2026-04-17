<!--
  @file ClyfActivationStep.svelte
  Canonical activation step for both overlay and route entrypoints.
  Layman-friendly chat validation with real inference and optional voice.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, MessageCircle, Send, Volume2, VolumeX } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { isInferenceReady, modelsState } from "$lib/domains/app/models/index.js";
import { withAction } from "$lib/sys/action-bus.svelte.js";
import { commands } from "$lib/sys/generated/bindings.js";
import WizardHelpTip from "../components/WizardHelpTip.svelte";
import WizardInfoPopup from "../components/WizardInfoPopup.svelte";
import { testInference } from "../wizard.service.js";

function unwrap<T>(r: { status: "ok"; data: T } | { status: "error"; error: string }): T {
	if (r.status === "error") {
		throw new Error(r.error);
	}
	return r.data;
}

import { wizardState } from "../wizard.state.svelte.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled?: boolean;
	continueBlockers?: string[];
}

let { onContinue, onBack, continueEnabled = false, continueBlockers = [] }: Props = $props();

let messages = $state<Array<{ role: "user" | "assistant"; content: string }>>([
	{
		role: "assistant",
		content:
			"Hey! I'm Clyffy. Try asking me something — like 'what can you help me with?' — so we can make sure everything works.",
	},
]);
let inputText = $state("");
let sending = $state(false);
let voiceEnabled = $state(false);
let showPageHelp = $state(false);

const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const brainReady = $derived(brainStatus ? isInferenceReady(brainStatus) : false);
const ttsStatus = $derived(modelsState.statuses["voice.tts"]);
const ttsReady = $derived(ttsStatus ? isInferenceReady(ttsStatus) : false);
const exchangeCount = $derived(messages.filter((m) => m.role === "user").length);
const canContinue = $derived(continueEnabled || exchangeCount >= 3);

async function sendMessage(): Promise<void> {
	const text = inputText.trim();
	if (!text || sending || !brainReady) return;

	inputText = "";
	messages = [...messages, { role: "user", content: text }];
	sending = true;

	try {
		const response = await testInference("chat.brain", text);
		messages = [...messages, { role: "assistant", content: response }];
		wizardState.roundTripCount = exchangeCount + 1;

		if (voiceEnabled && ttsReady) {
			try {
				await withAction("wizard.speak", "Speaking Clyffy's reply…", async () => {
					unwrap(await commands.speak(response, "default", null));
				});
			} catch {
				// Voice output is optional. Chat validation remains valid.
			}
		}
	} catch (e) {
		messages = [
			...messages,
			{
				role: "assistant",
				content: `Something went wrong: ${e instanceof Error ? e.message : String(e)}. Try again?`,
			},
		];
	} finally {
		sending = false;
	}
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
}
</script>

<div class="activate-page">
	<Text size="xl" weight="bold">Talk to Clyffy</Text>
	<div class="help-row">
		<WizardHelpTip tip="This is a confidence check: if chat works here, your core model setup is valid." />
		<Button preset="ghost" size="sm" onclick={() => (showPageHelp = true)}>
			What to test here
		</Button>
	</div>

	{#if !brainReady}
		<Card class="brain-missing-card">
			<img src="/imgs/mascot/clyffy-anim-sidelook.png" alt="Clyffy waiting" class="missing-mascot" />
			<Text size="base" weight="semibold" color="warning">Clyffy's Brain isn't loaded yet</Text>
			<Text size="sm" color="muted">Download and load a brain model first so Clyffy can chat with you.</Text>
			<div class="missing-actions">
				<Button preset="primary" size="md" onclick={onBack}>
					Go Set Up Models
				</Button>
			</div>
		</Card>
	{:else}
		<Text size="sm" color="secondary">
			{#if exchangeCount < 3}
				Send {3 - exchangeCount} more message{3 - exchangeCount > 1 ? "s" : ""} to make sure everything works.
			{:else}
				Clyffy is working! You can continue.
			{/if}
		</Text>

		<div class="chat-area" role="log" aria-label="Conversation with Clyffy">
			{#each messages as msg, index (index)}
				<div class="bubble" class:user={msg.role === "user"} class:assistant={msg.role === "assistant"}>
					{#if msg.role === "assistant"}
						<span class="bubble-icon"><MessageCircle size={14} /></span>
					{/if}
					<span class="bubble-text">{msg.content}</span>
				</div>
			{/each}
			{#if sending}
				<div class="bubble assistant">
					<span class="bubble-icon"><MessageCircle size={14} /></span>
					<span class="bubble-thinking">Clyffy is thinking...</span>
				</div>
			{/if}
		</div>

		<div class="input-row">
			<input
				class="chat-input"
				type="text"
				placeholder="Type a message..."
				bind:value={inputText}
				onkeydown={handleKeydown}
				disabled={sending}
				aria-label="Message to Clyffy"
			/>
			<Button preset="primary" size="sm" onclick={sendMessage} disabled={sending || !inputText.trim()}>
				<Send size={14} />
			</Button>
		</div>

		<div class="footer-row">
			<button
				type="button"
				class="voice-btn"
				class:active={voiceEnabled}
				onclick={() => (voiceEnabled = !voiceEnabled)}
				disabled={!ttsReady}
				aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
				title={ttsReady ? (voiceEnabled ? "Voice enabled" : "Enable voice") : "Download Voice Output model to enable speech"}
			>
				{#if voiceEnabled}<Volume2 size={14} />{:else}<VolumeX size={14} />{/if}
			</button>
			{#if !ttsReady}
				<Text size="xs" color="muted">Voice not available — download Voice Output model first</Text>
			{/if}

			<div class="exchange-bar" role="progressbar" aria-valuenow={exchangeCount} aria-valuemax={3}>
				{#each Array(3) as _, i}
					<span class="exchange-dot" class:filled={i < exchangeCount}></span>
				{/each}
				<span class="exchange-label">{exchangeCount}/3</span>
			</div>
		</div>
	{/if}

	<div class="nav">
		<Button preset="ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} /> Back
		</Button>
		{#if canContinue}
			<Button preset="primary" size="md" onclick={onContinue}>
				Continue <ArrowRight size={14} />
			</Button>
		{:else if continueBlockers.length > 0}
			<Text size="xs" color="muted">{continueBlockers[0]}</Text>
		{/if}
	</div>
</div>

<WizardInfoPopup
	open={showPageHelp}
	title="Activation Test"
	summary="This step confirms your main AI is really loaded and responding."
	points={[
		"Send at least 3 messages to verify stable responses.",
		"If this fails, go back to Models and check assignments.",
		"Voice toggle only works when Voice Output model is ready.",
		"Once chat works here, continuing is safe.",
	]}
	imageSrc="/imgs/mascot/clyffy-anim-sidelook.png"
	onClose={() => (showPageHelp = false)}
/>

<style>
	.activate-page {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 32rem;
		flex: 1;
	}
	.help-row {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.375rem;
	}
	:global(.brain-missing-card) {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
		text-align: center;
	}
	.missing-mascot {
		width: 4rem;
		height: 4rem;
		object-fit: contain;
	}
	.missing-actions {
		display: flex;
		gap: 0.5rem;
	}
	.chat-area {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
		min-height: 12rem;
		max-height: 24rem;
		overflow-y: auto;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--glass-deep);
		border: var(--border-preset-default-width) solid var(--border-subtle);
	}
	.bubble {
		display: flex;
		gap: 0.5rem;
		max-width: 85%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	.bubble.assistant {
		align-self: flex-start;
		background: var(--accent-purple-fill);
		color: var(--text-primary);
		border-bottom-left-radius: var(--radius-xs);
	}
	.bubble.user {
		align-self: flex-end;
		background: var(--accent-teal-fill);
		color: var(--text-primary);
		border-bottom-right-radius: var(--radius-xs);
	}
	.bubble-icon {
		color: var(--accent-purple-main);
		flex-shrink: 0;
		margin-top: 0.125rem;
	}
	.bubble-text {
		word-break: break-word;
	}
	.bubble-thinking {
		color: var(--text-muted);
		font-style: italic;
	}
	.input-row {
		display: flex;
		gap: 0.5rem;
	}
	.chat-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		background: var(--matte-dark);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
	}
	.chat-input:focus {
		border-color: var(--accent-cyan-main);
	}
	.chat-input::placeholder {
		color: var(--text-muted);
	}
	.footer-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.voice-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		border: var(--border-preset-default-width) solid var(--border-subtle);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
	}
	.voice-btn.active {
		border-color: var(--accent-hotpink-main);
		color: var(--accent-hotpink-main);
		background: var(--accent-hotpink-fill);
	}
	.voice-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.exchange-bar {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		margin-left: auto;
	}
	.exchange-dot {
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-full);
		background: var(--color-void-600);
	}
	.exchange-dot.filled {
		background: var(--accent-green-main);
	}
	.exchange-label {
		font-size: 0.75rem;
		color: var(--text-muted);
	}
	.nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding-top: 0.5rem;
	}
</style>
