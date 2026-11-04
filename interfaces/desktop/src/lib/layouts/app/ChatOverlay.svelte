<!--
  @file ChatOverlay — Draggable floating chat panel
  @layer lib
  @package @devpulse/layouts/app

  Embeds the chat as a draggable overlay within the main app window.
  Toggle via Ctrl+Shift+C or the top bar. Draggable by the title bar.
  The conversation is chatState's, the same one the chat window shows for the
  active project, so what you send goes wherever that project's chat is routed.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { ChatBubble } from "@devpulse/coldlight/components/chat-bubble";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField as Input } from "@devpulse/coldlight/components/text-field";
import { cn, hstack, stack } from "@devpulse/coldlight/utils";
import { GripVertical, Mic, Minus, Send, Sparkles, X } from "lucide-svelte";
import { untrack } from "svelte";
import { projectsState } from "$lib/domains/app/projects/index.js";
import { chatState } from "$lib/domains/chat/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let { open = $bindable(false) }: { open?: boolean } = $props();

const text = $derived(copyState.catalog?.hubs.chat_overlay);

let inputValue = $state("");
const busy = $derived(chatState.sending || chatState.isGenerating);
const canSend = $derived(platformState.isReady && inputValue.trim().length > 0 && !busy);

// Draggable state: null until the first drag, when the panel keeps its corner.
let panel = $state<HTMLElement | null>(null);
let scroller = $state<HTMLElement | null>(null);
let position = $state<{ x: number; y: number } | null>(null);
let dragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let handleHeight = 0;
let minimized = $state(false);

function onDragStart(e: MouseEvent) {
	if (!panel || !(e.currentTarget instanceof HTMLElement)) return;
	const box = panel.getBoundingClientRect();
	dragging = true;
	dragOffsetX = e.clientX - box.left;
	dragOffsetY = e.clientY - box.top;
	handleHeight = e.currentTarget.offsetHeight;
	position = { x: box.left, y: box.top };
	e.preventDefault();
}

function onDragMove(e: MouseEvent) {
	if (!dragging || !panel) return;
	const width = panel.getBoundingClientRect().width;
	position = {
		x: Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragOffsetX)),
		y: Math.max(0, Math.min(window.innerHeight - handleHeight, e.clientY - dragOffsetY)),
	};
}

function onDragEnd() {
	dragging = false;
}

// The active project's conversation, while the panel is open.
$effect(() => {
	if (!open || !projectsState.ready) return;
	void projectsState.activeProjectId;
	void chatState.activeSessionId;
	untrack(() => void chatState.loadActive());
});

// Keep to the newest message.
$effect(() => {
	void chatState.messages.length;
	void chatState.streamingContent;
	if (scroller) scroller.scrollTop = scroller.scrollHeight;
});

function sendMessage() {
	const content = inputValue.trim();
	if (!content || busy) return;
	inputValue = "";
	void chatState.generateResponse(content);
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
}
</script>

<svelte:window onmousemove={onDragMove} onmouseup={onDragEnd} />

{#if open}
<div
	bind:this={panel}
	class={cn(
		"fixed z-50 flex w-[var(--layouts-chat-overlay-width)] flex-col overflow-hidden",
		!position && "right-4 top-20",
		minimized ? "h-auto" : "h-[var(--layouts-chat-overlay-height)]",
	)}
	style={position ? `left: ${position.x}px; top: ${position.y}px;` : undefined}
	data-layout="chat-overlay"
	data-panel="raised"
	data-animate="fade-in-scale"
>
	<!-- Draggable title bar -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="flex cursor-move select-none items-center justify-between px-3 py-2"
		data-slot="overlay-title"
		onmousedown={onDragStart}
	>
		<div class={hstack({ gap: "2", align: "center" })}>
			<GripVertical size={12} />
			<span class="inline-flex" data-slot="overlay-spark"><Sparkles size={14} /></span>
			<Heading level={6} size="sm" class="font-display" data-text-glow="teal">{text?.title}</Heading>
		</div>
		<div class={hstack({ gap: "1" })}>
			<Button
				variant="ghost"
				size="sm"
				class="h-6 w-6 rounded-full"
				onclick={() => (minimized = !minimized)}
				title={minimized ? text?.expand : text?.minimize}
				aria-label={minimized ? text?.expand : text?.minimize}
			>
				<Minus size={12} />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-6 w-6 rounded-full"
				onclick={() => (open = false)}
				title={text?.close}
				aria-label={text?.close}
			>
				<X size={12} />
			</Button>
		</div>
	</div>

	{#if !minimized}
		<!-- Messages -->
		<div bind:this={scroller} class="min-h-0 flex-1 overflow-y-auto p-3" data-scrollbar="thin">
			{#if chatState.loading && chatState.messages.length === 0}
				<div class="flex items-center justify-center py-8">
					<Text size="sm" color="muted">{text?.loading}</Text>
				</div>
			{:else if chatState.blockMessages.length === 0 && !chatState.generatingHere}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<span class="inline-flex" data-slot="overlay-spark"><Sparkles size={24} /></span>
					<Text size="sm" color="muted">{text?.empty}</Text>
				</div>
			{:else}
				<div class={stack({ gap: "3" })}>
					{#each chatState.blockMessages as msg (msg.id)}
						<div class={cn(stack({ gap: "1" }), msg.variant === "user" ? "items-end" : "items-start")}>
							<ChatBubble
								variant={msg.variant}
								author={msg.variant === "ai" ? (msg.author ?? text?.title) : msg.author}
								timestamp={msg.timestamp}
								class="max-w-[var(--layouts-chat-overlay-bubble-max)] whitespace-pre-wrap"
							>
								{msg.content}
							</ChatBubble>
						</div>
					{/each}
					{#if chatState.generatingHere && chatState.streamingContent}
						<ChatBubble
							variant="ai"
							author={text?.title}
							class="max-w-[var(--layouts-chat-overlay-bubble-max)] whitespace-pre-wrap"
						>
							{chatState.streamingContent}
						</ChatBubble>
					{/if}
				</div>
			{/if}
			{#if chatState.error}
				<Text size="sm" role="alert" class="mt-3 block" data-text-glow="ember">{chatState.error}</Text>
			{/if}
		</div>

		<!-- Input area -->
		<div class={cn(hstack({ gap: "2", align: "center" }), "px-3 py-2")} data-slot="overlay-input">
			<Button
				variant="ghost"
				size="sm"
				class="h-7 w-7 shrink-0 rounded-full"
				title={text?.voice_unavailable}
				aria-label={text?.voice_unavailable}
				disabled
			>
				<Mic size={12} />
			</Button>
			<Input
				type="text"
				value={inputValue}
				onValueChange={(next) => { inputValue = next; }}
				onkeydown={handleKeydown}
				placeholder={text?.placeholder}
				size="sm"
				class="flex-1"
			/>
			<Button
				variant="ghost"
				size="sm"
				class="h-7 w-7 shrink-0 rounded-full"
				onclick={sendMessage}
				disabled={!canSend}
				title={platformState.isReady ? text?.send : text?.waiting}
				aria-label={platformState.isReady ? text?.send : text?.waiting}
			>
				<Send size={12} />
			</Button>
		</div>
	{/if}
</div>
{/if}

<style>
	[data-slot="overlay-title"] {
		border-bottom: var(--border-width-hairline) solid var(--border-soft);
		color: var(--text-muted);
	}

	[data-slot="overlay-spark"] {
		color: var(--color-teal-400);
	}

	[data-slot="overlay-input"] {
		border-top: var(--border-width-hairline) solid var(--border-soft);
	}
</style>
