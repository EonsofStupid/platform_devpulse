<!--
  @file Step-6-Activate.svelte
  Test that the brain responds. Chat interface with 3-exchange minimum.
  Absorbs: ClyfActivationStep (chat test, voice toggle, 3-exchange validation).
-->
<script lang="ts">
import { ArrowLeft, Check, MessageCircle, Send, Volume2, VolumeX } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import { modelsState } from "../../../data-access/models.state.svelte.js";
import { isInferenceReady } from "../../../util/models.types.js";
import { testInference } from "../wizard.service.js";

interface Props {
	onComplete: () => void;
	onBack: () => void;
}

let { onComplete, onBack }: Props = $props();

interface ChatMsg {
	role: "user" | "assistant" | "error";
	content: string;
}

let messages = $state<ChatMsg[]>([]);
let inputText = $state("");
let sending = $state(false);
let voiceEnabled = $state(false);
let loading = $state(false);
let loadError = $state<string | null>(null);

const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const ttsStatus = $derived(modelsState.statuses["voice.tts"]);
const brainReady = $derived(brainStatus ? isInferenceReady(brainStatus) : false);
const ttsReady = $derived(ttsStatus ? isInferenceReady(ttsStatus) : false);
const brainSlot = $derived(modelsState.slots.find((s) => s.id === "chat.brain"));
const hasBrain = $derived(!!brainSlot?.assigned_model_id);

const exchangeCount = $derived(messages.filter((m) => m.role === "assistant").length);
const canContinue = $derived(exchangeCount >= 3);

// Load brain on mount if assigned but not ready
$effect(() => {
	if (hasBrain && !brainReady && !loading) {
		void loadBrain();
	}
});

async function loadBrain(): Promise<void> {
	loading = true;
	loadError = null;
	try {
		await modelsState.load("chat.brain");
	} catch (e) {
		loadError = e instanceof Error ? e.message : String(e);
	} finally {
		loading = false;
	}
}

async function sendMessage(): Promise<void> {
	const text = inputText.trim();
	if (!text || sending) return;

	messages = [...messages, { role: "user", content: text }];
	inputText = "";
	sending = true;

	try {
		const response = await testInference("chat.brain", text);
		messages = [...messages, { role: "assistant", content: response }];

		// Voice output if enabled and TTS ready
		if (voiceEnabled && ttsReady) {
			try {
				await commands.speak(response, "default", null);
			} catch {
				// Voice failure is non-blocking
			}
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		messages = [...messages, { role: "error", content: `Something went wrong: ${msg}` }];
	} finally {
		sending = false;
	}
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		void sendMessage();
	}
}
</script>

<div class="activate-step">
	<div class="activate-header">
		<img src="/imgs/mascot/clyffy-df-icon-interaction1.png" alt="Clyffy" class="activate-mascot" />
		<div>
			<Heading level={3} size="lg">Test Chat</Heading>
			<Text size="sm" class="activate-desc">Have a conversation with Clyffy to verify the brain is working.</Text>
		</div>
	</div>

	{#if !hasBrain}
		<div class="no-brain-card">
			<Text size="sm" weight="bold">No brain model assigned</Text>
			<Text size="xs" class="no-brain-hint">Go back to Step 2 and assign a model to the Brain slot.</Text>
			<Button preset="button-secondary" size="sm" onclick={onBack}>
				<ArrowLeft size={14} />
				Go Back
			</Button>
		</div>
	{:else if loading}
		<div class="loading-card">
			<Spinner size="md" tone="accent" />
			<Text size="sm">Loading brain model into memory...</Text>
		</div>
	{:else if loadError}
		<div class="error-card">
			<Text size="sm" class="error-text">{loadError}</Text>
			<Button preset="button-secondary" size="sm" onclick={loadBrain}>Retry</Button>
		</div>
	{:else}
		<!-- Progress indicator -->
		<div class="exchange-progress">
			{#each [1, 2, 3] as n}
				<div class="exchange-dot" class:filled={exchangeCount >= n}>
					{#if exchangeCount >= n}
						<Check size={10} />
					{:else}
						{n}
					{/if}
				</div>
			{/each}
			<Text size="xs" class="exchange-label">
				{#if canContinue}
					All checks passed
				{:else}
					{exchangeCount}/3 exchanges — send {3 - exchangeCount} more
				{/if}
			</Text>
		</div>

		<!-- Chat messages -->
		<div class="chat-area">
			{#if messages.length === 0}
				<div class="chat-empty">
					<MessageCircle size={24} />
					<Text size="sm" class="chat-empty-text">Say hello to Clyffy!</Text>
				</div>
			{/if}

			{#each messages as msg (msg)}
				<div class="chat-bubble {msg.role}">
					<Text size="sm">{msg.content}</Text>
				</div>
			{/each}

			{#if sending}
				<div class="chat-bubble assistant">
					<Spinner size="xs" tone="accent" />
					<Text size="xs" class="thinking-text">Clyffy is thinking...</Text>
				</div>
			{/if}
		</div>

		<!-- Input bar -->
		<div class="input-bar">
			<input
				type="text"
				class="chat-input"
				placeholder="Type a message..."
				bind:value={inputText}
				onkeydown={handleKeydown}
				disabled={sending || !brainReady}
			/>
			<button
				class="voice-btn"
				class:active={voiceEnabled}
				onclick={() => (voiceEnabled = !voiceEnabled)}
				disabled={!ttsReady}
				title={ttsReady ? (voiceEnabled ? "Disable voice" : "Enable voice") : "TTS model not loaded"}
			>
				{#if voiceEnabled}
					<Volume2 size={16} />
				{:else}
					<VolumeX size={16} />
				{/if}
			</button>
			<Button preset="button-primary" size="sm" onclick={sendMessage} disabled={sending || !inputText.trim() || !brainReady}>
				<Send size={14} />
			</Button>
		</div>
	{/if}

	<div class="step-nav">
		<Button preset="button-ghost" size="sm" onclick={onBack}>
			<ArrowLeft size={14} />
			Back
		</Button>
		{#if canContinue}
			<Button preset="button-primary" size="md" onclick={onComplete}>
				<Check size={14} />
				Continue
			</Button>
		{/if}
	</div>
</div>

<style>
	.activate-step {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
		max-width: 42rem;
		padding: 1rem 0;
	}

	.activate-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.activate-mascot {
		width: 3rem;
		height: 3rem;
		object-fit: contain;
	}

	:global(.activate-desc) {
		color: var(--text-secondary);
	}

	.no-brain-card, .loading-card, .error-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem;
		border-radius: 0.75rem;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		text-align: center;
	}

	:global(.no-brain-hint) { color: var(--text-muted); }
	:global(.error-text) { color: var(--signal-error); }

	.exchange-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0;
	}

	.exchange-dot {
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
	.exchange-dot.filled {
		background: color-mix(in oklch, var(--signal-success) 20%, transparent);
		border-color: var(--signal-success);
		color: var(--signal-success);
	}

	:global(.exchange-label) { color: var(--text-muted); }

	.chat-area {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 12rem;
		max-height: 24rem;
		overflow-y: auto;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: var(--surface-base);
		border: 1px solid var(--border-soft);
	}

	.chat-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex: 1;
		min-height: 8rem;
		color: var(--text-muted);
	}
	:global(.chat-empty-text) { color: var(--text-muted); }

	.chat-bubble {
		max-width: 80%;
		padding: 0.625rem 0.875rem;
		border-radius: 0.75rem;
		word-break: break-word;
	}
	.chat-bubble.user {
		align-self: flex-end;
		background: color-mix(in oklch, var(--accent-teal-fill) 80%, transparent);
		border: 1px solid color-mix(in oklch, var(--accent-teal-main) 25%, transparent);
	}
	.chat-bubble.assistant {
		align-self: flex-start;
		background: var(--surface-raised);
		border: 1px solid var(--border-soft);
		display: flex;
		align-items: flex-start;
		gap: 0.375rem;
	}
	.chat-bubble.error {
		align-self: center;
		background: color-mix(in oklch, var(--signal-error) 10%, transparent);
		border: 1px solid color-mix(in oklch, var(--signal-error) 30%, transparent);
		color: var(--signal-error);
		font-size: 0.8125rem;
	}

	:global(.thinking-text) { color: var(--text-muted); }

	.input-bar {
		display: flex;
		gap: 0.375rem;
		align-items: center;
	}

	.chat-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid var(--border-soft);
		background: var(--surface-raised);
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 150ms ease-out;
	}
	.chat-input:focus { border-color: var(--accent-teal-main); }
	.chat-input::placeholder { color: var(--text-muted); }
	.chat-input:disabled { opacity: 0.5; }

	.voice-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 0.375rem;
		border: 1px solid var(--border-soft);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 150ms ease-out;
	}
	.voice-btn:hover:not(:disabled) { border-color: var(--border-default); color: var(--text-secondary); }
	.voice-btn.active { border-color: var(--accent-teal-main); color: var(--accent-teal-main); }
	.voice-btn:disabled { opacity: 0.3; cursor: not-allowed; }

	.step-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.5rem;
	}
</style>
