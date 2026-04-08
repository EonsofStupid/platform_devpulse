<!--
  @file ClyfActivationStep.svelte
  Test chat with Clyffy. Uses test_inference (now exists).
  ColdLight tokens. Exchange counter. Voice toggle.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, MessageCircle, Send, Volume2, VolumeX } from "lucide-svelte";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { isInferenceReady } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}
let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();

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
let speaking = $state(false);

const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const brainReady = $derived(brainStatus ? isInferenceReady(brainStatus) : false);
const ttsReady = $derived(isInferenceReady(modelsState.statuses["voice.tts"] ?? { type: "cold" }));
const exchangeCount = $derived(messages.filter((m) => m.role === "user").length);

async function sendMessage(): Promise<void> {
	const text = inputText.trim();
	if (!text || sending || !brainReady) return;

	inputText = "";
	messages = [...messages, { role: "user", content: text }];
	sending = true;

	try {
		const { invoke } = await import("@tauri-apps/api/core");
		const response = await invoke<string>("test_inference", {
			slotId: "chat.brain",
			prompt: text,
		});

		messages = [...messages, { role: "assistant", content: response }];
		wizardState.roundTripCount = exchangeCount + 1;

		if (voiceEnabled && ttsReady) {
			speaking = true;
			try {
				await invoke("speak", { text: response, voice: "default" });
			} catch {
				/* TTS failure non-fatal */
			}
			speaking = false;
		}
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		messages = [
			...messages,
			{ role: "assistant", content: `Something went wrong: ${msg}. Try again?` },
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

<div class="clyf-step">
	<h2 class="step-title">Talk to Clyffy</h2>
	{#if !brainReady}
		<p class="step-warn">Clyffy's Brain isn't loaded yet. Go back and set up a model first.</p>
	{:else}
		<p class="step-desc">
			{#if exchangeCount < 3}
				Send {3 - exchangeCount} more message{3 - exchangeCount > 1 ? "s" : ""} to continue.
			{:else}
				Ready to continue!
			{/if}
		</p>
	{/if}

	<!-- Chat area -->
	<div class="chat-area">
		{#each messages as msg (msg)}
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
				<span class="bubble-thinking">Thinking...</span>
			</div>
		{/if}
	</div>

	<!-- Input row -->
	<div class="input-row">
		<input
			class="chat-input"
			type="text"
			placeholder={brainReady ? "Type a message..." : "Load a model first"}
			bind:value={inputText}
			onkeydown={handleKeydown}
			disabled={!brainReady || sending}
		/>
		<button class="btn-send" onclick={sendMessage} disabled={!brainReady || sending || !inputText.trim()}>
			<Send size={14} />
		</button>
	</div>

	<!-- Voice toggle + exchange counter -->
	<div class="footer-row">
		<button
			class="btn-voice"
			class:active={voiceEnabled}
			onclick={() => (voiceEnabled = !voiceEnabled)}
			disabled={!ttsReady}
			aria-label={voiceEnabled ? "Disable voice" : "Enable voice"}
		>
			{#if voiceEnabled}
				<Volume2 size={14} />
			{:else}
				<VolumeX size={14} />
			{/if}
		</button>
		{#if speaking}
			<span class="speaking-indicator">Speaking...</span>
		{/if}

		<div class="exchange-dots">
			{#each Array(3) as _, i}
				<span class="dot" class:filled={i < exchangeCount}></span>
			{/each}
			<span class="dot-label">{exchangeCount}/3</span>
		</div>
	</div>

	<!-- Navigation -->
	<div class="nav">
		<button class="btn-back" onclick={onBack}><ArrowLeft size={14} /> Back</button>
		<div class="nav-right">
			{#if !continueEnabled && continueBlockers.length > 0}
				<span class="blocker">{continueBlockers[0]}</span>
			{/if}
			<button class="btn-continue" onclick={onContinue} disabled={!continueEnabled}>
				Continue <ArrowRight size={14} />
			</button>
		</div>
	</div>
</div>

<style>
	.clyf-step {
		display: flex; flex-direction: column; gap: 1rem;
		width: 100%; max-width: 32rem; flex: 1; min-height: 0;
	}
	.step-title { font-size: 1.25rem; font-weight: 800; color: var(--wiz-text); margin: 0; }
	.step-desc { font-size: var(--wiz-text-sm); color: var(--wiz-text-sub); margin: 0; }
	.step-warn { font-size: var(--wiz-text-sm); color: var(--wiz-coral); margin: 0; }

	.chat-area {
		display: flex; flex-direction: column; gap: 0.5rem;
		flex: 1; min-height: 12rem; max-height: 24rem; overflow-y: auto;
		padding: 0.75rem; border-radius: var(--wiz-radius-lg);
		background: var(--wiz-card); border: 1px solid var(--wiz-border);
	}
	.bubble {
		display: flex; gap: 0.5rem; max-width: 85%;
		padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		font-size: var(--wiz-text-sm); line-height: 1.5;
	}
	.bubble.assistant {
		align-self: flex-start; background: var(--wiz-fill-purple);
		color: var(--wiz-text); border-bottom-left-radius: var(--wiz-radius-xs);
	}
	.bubble.user {
		align-self: flex-end; background: var(--wiz-fill-cyan);
		color: var(--wiz-text); border-bottom-right-radius: var(--wiz-radius-xs);
	}
	.bubble-icon { color: var(--wiz-role-brain); flex-shrink: 0; margin-top: 0.125rem; }
	.bubble-text { word-break: break-word; }
	.bubble-thinking { color: var(--wiz-text-muted); font-style: italic; }

	.input-row { display: flex; gap: 0.5rem; }
	.chat-input {
		flex: 1; padding: 0.5rem 0.75rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: var(--wiz-inset);
		color: var(--wiz-text); font-size: var(--wiz-text-sm);
		outline: none; transition: border-color var(--wiz-duration-fast);
	}
	.chat-input:focus { border-color: var(--wiz-border-focus); }
	.chat-input:disabled { opacity: 0.5; }
	.chat-input::placeholder { color: var(--wiz-text-muted); }
	.btn-send {
		display: inline-flex; align-items: center; justify-content: center;
		width: 2.25rem; height: 2.25rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950); cursor: pointer;
	}
	.btn-send:hover { filter: brightness(1.15); }
	.btn-send:disabled { opacity: 0.3; cursor: not-allowed; }

	.footer-row { display: flex; align-items: center; gap: 0.75rem; }
	.btn-voice {
		display: inline-flex; align-items: center; justify-content: center;
		width: 2rem; height: 2rem; border-radius: var(--wiz-radius-md);
		border: 1px solid var(--wiz-border); background: transparent;
		color: var(--wiz-text-muted); cursor: pointer;
	}
	.btn-voice.active { border-color: var(--wiz-hotpink); color: var(--wiz-hotpink); background: var(--wiz-fill-magenta); }
	.btn-voice:disabled { opacity: 0.3; cursor: not-allowed; }
	.speaking-indicator { font-size: var(--wiz-text-xs); color: var(--wiz-hotpink); animation: pulse 1.5s ease-in-out infinite; }
	@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

	.exchange-dots { display: flex; align-items: center; gap: 0.375rem; margin-left: auto; }
	.dot { width: 0.5rem; height: 0.5rem; border-radius: var(--wiz-radius-full); background: var(--wiz-void-700); }
	.dot.filled { background: var(--wiz-green); }
	.dot-label { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }

	.nav { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-top: 0.5rem; }
	.nav-right { display: flex; align-items: center; gap: 0.75rem; }
	.blocker { font-size: var(--wiz-text-xs); color: var(--wiz-text-muted); }
	.btn-back {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1rem; border-radius: var(--wiz-radius-md); border: none;
		background: transparent; color: var(--wiz-text-muted); font-size: var(--wiz-text-sm); cursor: pointer;
	}
	.btn-continue {
		display: inline-flex; align-items: center; gap: 0.375rem;
		padding: 0.5rem 1.5rem; border-radius: var(--wiz-radius-md); border: none;
		background: var(--wiz-cyan); color: var(--wiz-void-950);
		font-size: var(--wiz-text-sm); font-weight: 700; cursor: pointer;
	}
	.btn-continue:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
