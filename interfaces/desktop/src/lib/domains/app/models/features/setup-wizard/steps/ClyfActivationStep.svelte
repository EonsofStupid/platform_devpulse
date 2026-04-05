<!--
  @file ClyfActivationStep.svelte
  @module @devpulse/domains/app/models/features/setup-wizard/steps/ClyfActivationStep

  Phase 4. First real conversation with Clyffy.
  Chat input, pipeline monitor, round-trip counter, manual confirm.
  Inference errors displayed raw — expected if no model loaded.
-->
<script lang="ts">
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Send } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { generateText } from "../../../services/inference.service.js";
import { formatMb } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";

interface Props {
	onContinue: () => void;
	onBack: () => void;
	continueEnabled: boolean;
	continueBlockers: string[];
}

let { onContinue, onBack, continueEnabled, continueBlockers }: Props = $props();

let inputText = $state("");
let messages = $state<Array<{ role: "user" | "assistant"; text: string }>>([]);
let generating = $state(false);
let lastRoundTripMs = $state<number | null>(null);
let pipelineError = $state<string | null>(null);

const brainStatus = $derived(modelsState.statuses["chat.brain"]);
const brainLoaded = $derived(brainStatus?.type === "hot" || brainStatus?.type === "standby");

async function sendMessage(): Promise<void> {
	if (!inputText.trim() || generating) return;

	const userMsg = inputText.trim();
	inputText = "";
	messages = [...messages, { role: "user", text: userMsg }];

	generating = true;
	pipelineError = null;
	const start = performance.now();

	try {
		const response = await generateText("chat.brain", userMsg, 256, 0.7);
		const elapsed = Math.round(performance.now() - start);
		lastRoundTripMs = elapsed;
		messages = [...messages, { role: "assistant", text: response }];
		wizardState.roundTripCount += 1;
	} catch (e) {
		const msg = e instanceof Error ? e.message : String(e);
		pipelineError = msg;
		messages = [...messages, { role: "assistant", text: `[Error: ${msg}]` }];
	} finally {
		generating = false;
	}
}

function confirmClyffy(): void {
	wizardState.clyfConfirmed = true;
}

function handleKeydown(e: KeyboardEvent): void {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
}
</script>

<div class={`${stack({ gap: "6" })} w-full flex-1`}>
	<Text size="lg" weight="bold" color="primary">Clyffy Activation</Text>

	<!-- Chat area -->
	<div
		class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-lg flex-1 overflow-y-auto border min-h-52 max-h-96")}
		style="background: var(--surface-base); border-color: var(--border-subtle);"
	>
		<div class={stack({ gap: "3" })}>
			{#if messages.length === 0}
				<Text size="sm" color="muted">
					Say something to Clyffy to test the pipeline...
				</Text>
			{/if}
			{#each messages as msg, i (i)}
				<div class={hstack({ gap: "3", align: "start" })}>
					<Badge
						variant={msg.role === "user" ? "accent" : "informative"}
						size="sm"
					>
						{msg.role === "user" ? "You" : "Clyffy"}
					</Badge>
					<Text size="sm" color={msg.role === "user" ? "primary" : "secondary"}>
						{msg.text}
					</Text>
				</div>
			{/each}
			{#if generating}
				<div class={hstack({ gap: "2", align: "center" })}>
					<LoaderCircle size={12} class="animate-spin" style="color: var(--accent-teal-main);" />
					<Text size="xs" color="muted">Thinking...</Text>
				</div>
			{/if}
		</div>
	</div>

	<!-- Input -->
	<div class={hstack({ gap: "3", align: "center" })}>
		<input
			type="text"
			placeholder="Type a message..."
			bind:value={inputText}
			onkeydown={handleKeydown}
			disabled={generating}
			class="flex-1 rounded-lg px-4 py-2 text-sm border"
			style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
			aria-label="Message to Clyffy"
		/>
		<button
			class="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all disabled:opacity-40"
			style="background: var(--accent-teal-main); color: var(--surface-base);"
			onclick={sendMessage}
			disabled={generating || !inputText.trim()}
			aria-label="Send message"
		>
			<Send size={14} />
		</button>
	</div>

	<!-- Pipeline monitor -->
	<div
		class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}
		style="background: var(--surface-elevated); border-color: var(--border-subtle);"
	>
		<div class={hstack({ gap: "8", align: "center" })}>
			<Text size="xs" color="muted">
				Brain: {brainLoaded ? "hot" : "cold"}
			</Text>
			<Text size="xs" color="muted">
				VRAM: {formatMb(hardwareState.vramUsedMb)}/{formatMb(hardwareState.vramTotalMb)}
			</Text>
			<Text size="xs" color="muted">
				Last: {lastRoundTripMs !== null ? `${lastRoundTripMs}ms` : "—"}
			</Text>
			<Text size="xs" color="muted">
				Round-trips: {wizardState.roundTripCount}/3
			</Text>
		</div>
	</div>

	<!-- Personality check -->
	<div class={stack({ gap: "2" })}>
		<Text size="xs" weight="bold" color="secondary">Personality Check</Text>
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if wizardState.roundTripCount > 0}
				<Check size={12} style="color: var(--signal-success);" />
			{:else}
				<span class="w-3 h-3 rounded-full border" style="border-color: var(--border-subtle);"></span>
			{/if}
			<Text size="xs" color="muted">Clyffy responded coherently</Text>
		</div>
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if wizardState.roundTripCount >= 3}
				<Check size={12} style="color: var(--signal-success);" />
			{:else}
				<span class="w-3 h-3 rounded-full border" style="border-color: var(--border-subtle);"></span>
			{/if}
			<Text size="xs" color="muted">3+ exchanges ({wizardState.roundTripCount}/3)</Text>
		</div>
		<div class={hstack({ gap: "2", align: "center" })}>
			{#if wizardState.clyfConfirmed}
				<Check size={12} style="color: var(--signal-success);" />
			{:else}
				<span class="w-3 h-3 rounded-full border" style="border-color: var(--border-subtle);"></span>
			{/if}
			<Text size="xs" color="muted">Manual confirm</Text>
		</div>

		{#if !wizardState.clyfConfirmed}
			<button
				class="rounded px-3 py-1 text-xs transition-colors border"
				style="border-color: var(--border-subtle); color: var(--text-secondary);"
				onclick={confirmClyffy}
			>
				Clyffy's working, let's go
			</button>
		{/if}
	</div>

	<!-- Error -->
	{#if pipelineError}
		<div
			class={cn(box({ paddingX: "12", paddingY: "8" }), "rounded-md")}
			style="background: var(--signal-error); color: var(--text-primary);"
		>
			<Text size="xs" color="primary">{pipelineError}</Text>
		</div>
	{/if}

	<!-- Navigation -->
	<div class={hstack({ gap: "4", align: "center", justify: "between" })}>
		<button
			class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
			style="color: var(--text-muted);"
			onclick={onBack}
			aria-label="Back to voice pipeline"
		>
			<ArrowLeft size={14} />
			Back
		</button>
		<div class={stack({ gap: "2", align: "end" })}>
			{#if !continueEnabled && continueBlockers.length > 0}
				<Text size="xs" color="muted">{continueBlockers[0]}</Text>
			{/if}
			<button
				class="flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
				style="background: var(--accent-teal-main); color: var(--surface-base);"
				onclick={onContinue}
				disabled={!continueEnabled}
				aria-label="Continue to project setup"
			>
				Continue
				<ArrowRight size={14} />
			</button>
		</div>
	</div>
</div>
