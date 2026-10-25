<!--
  @file ChatOverlay — Draggable floating chat panel
  @layer lib
  @package @devpulse/layouts/app

  Embeds the Maestro chat as a draggable overlay within the main app window.
  Toggle via Ctrl+Shift+C. Draggable by the title bar.

	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { GripVertical, Mic, Minus, Send, Sparkles, X } from "lucide-svelte";
import { box } from "$lib/design/utils/box/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { TextField as Input } from "$lib/design/components/text-field/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatMessage } from "$lib/sys/generated/chat.types.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let { open = $bindable(false) }: { open?: boolean } = $props();

let messages = $state<ChatMessage[]>([]);
let loading = $state(true);
let inputValue = $state("");
let sending = $state(false);
const canSend = $derived(platformState.isReady && inputValue.trim().length > 0 && !sending);

// Draggable state — guard for SSR (window unavailable during server render)
const initialX = typeof window !== "undefined" ? window.innerWidth - 480 : 400;
let posX = $state(initialX);
let posY = $state(60);
let dragging = $state(false);
let dragOffsetX = 0;
let dragOffsetY = 0;
let minimized = $state(false);

function onDragStart(e: MouseEvent) {
	dragging = true;
	dragOffsetX = e.clientX - posX;
	dragOffsetY = e.clientY - posY;
	e.preventDefault();
}

function onDragMove(e: MouseEvent) {
	if (!dragging) return;
	posX = Math.max(0, Math.min(window.innerWidth - 420, e.clientX - dragOffsetX));
	posY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffsetY));
}

function onDragEnd() {
	dragging = false;
}

async function loadMessages() {
	loading = true;
	try {
		const history = await invoke<ChatMessage[]>("load_recent");
		messages = history;
	} catch {
		setTimeout(loadMessages, 2000);
	} finally {
		loading = false;
	}
}

$effect(() => {
	if (open) loadMessages();
});

async function sendMessage() {
	if (!inputValue.trim() || sending) return;
	const content = inputValue.trim();
	inputValue = "";
	sending = true;
	try {
		const stored = await invoke<ChatMessage>("send_message", { content });
		messages = [...messages, stored];
	} catch (e) {
		const errorMsg: ChatMessage = {
			id: Date.now(),
			session_id: "",
			role: "assistant",
			content: `Error: ${e instanceof Error ? e.message : String(e)}`,
			created_at: Math.floor(Date.now() / 1000),
		};
		messages = [...messages, errorMsg];
	} finally {
		sending = false;
	}
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Enter" && !e.shiftKey) {
		e.preventDefault();
		sendMessage();
	}
}

function formatTime(epoch: number): string {
	if (epoch === 0) return "";
	const date = new Date(epoch * 1000);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
</script>

<svelte:window onmousemove={onDragMove} onmouseup={onDragEnd} />

{#if open}
<div
	class="fixed z-50"
	style="left: {posX}px; top: {posY}px; width: 420px;"
	data-layout="chat-overlay"
>
	<div
		class={cn(box({ padding: "4" }), "v-s3 v-d2 v-b2 v-g1 v-f2 v-r3 flex flex-col overflow-hidden v-d3", minimized ? 'h-auto' : 'h-[520px]')}
		data-kind="box"
		data-slot="root"
	>
		<!-- Draggable title bar -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex items-center justify-between px-3 py-2 border-b border-border-soft cursor-move select-none"
			onmousedown={onDragStart}
		>
			<div class={hstack({ gap: "2", align: "center" })}>
				<GripVertical size={12} class="text-text-muted" />
				<Sparkles size={14} class="text-[var(--color-teal-400)] drop-shadow-[0_0_6px_var(--glow-teal)]" />
				<Heading level={6} size="xs" class="font-display text-[var(--color-teal-300)]">Maestro</Heading>
			</div>
			<div class={hstack({ gap: "1" })}>
				<Button
					intent="ghost"
					size="sm"
					class="h-6 w-6 rounded-full"
					onclick={() => (minimized = !minimized)}
					title={minimized ? "Expand" : "Minimize"}
				>
					<Minus size={12} />
				</Button>
				<Button
					intent="ghost"
					size="sm"
					class="h-6 w-6 rounded-full"
					onclick={() => (open = false)}
					title="Close"
				>
					<X size={12} />
				</Button>
			</div>
		</div>

		{#if !minimized}
			<!-- Messages -->
			<div class={cn(box({}), "flex-1 overflow-y-auto scrollbar-thin p-3")} data-kind="box" data-slot="root">
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<Text size="sm" color="muted">Loading messages...</Text>
					</div>
				{:else if messages.length === 0}
					<div class="flex flex-col items-center justify-center py-8 gap-2">
						<Sparkles size={24} class="text-[var(--color-teal-400)] drop-shadow-[0_0_8px_var(--glow-teal)]" />
						<Text size="sm" color="muted">No messages yet. Start a conversation.</Text>
					</div>
				{:else}
					<div class={stack({ gap: "3" })}>
						{#each messages as msg (msg.id)}
							<div class={cn(stack({ gap: "1" }), msg.role === "user" ? "items-end" : "")}>
								{#if msg.role === "assistant"}
									<div
										class={cn(box({}), "v-s5 v-d2 v-b2 v-g3 v-f3 v-r3 max-w-[85%] px-4 py-3")}
										data-kind="box"
										data-slot="root"
									>
										<div class={cn(hstack({ gap: "1" }), "mb-1.5")}>
											<Sparkles size={12} class="text-[var(--color-purple-300)] drop-shadow-[0_0_6px_var(--glow-purple)]" />
											<Heading level={6} size="xs" class="font-display text-[var(--color-purple-300)]">Maestro</Heading>
										</div>
										<Text size="sm" class="whitespace-pre-wrap leading-relaxed text-text-primary">{msg.content}</Text>
									</div>
								{:else}
									<div
										class={cn(box({}), "v-s4 v-d2 v-b2 v-g1 v-f2 v-r3 max-w-[85%] px-4 py-3")}
										data-kind="box"
										data-slot="root"
									>
										<Text size="sm" class="whitespace-pre-wrap leading-relaxed text-text-primary">{msg.content}</Text>
									</div>
								{/if}
								<Text size="xs" color="muted" class="px-1">{formatTime(msg.created_at)}</Text>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Input area -->
			<div
				class={cn(hstack({ gap: "2", align: "center" }), "v-s3 v-d1 v-f4 border-t border-border-soft px-3 py-2")}
			>
				<Button
					intent="ghost"
					size="sm"
					class="h-7 w-7 shrink-0 rounded-full"
					title="Voice input"
				>
					<Mic size={12} />
				</Button>
				<Input
					type="text"
					value={inputValue}
					oninput={(e) => { inputValue = e.currentTarget.value; }}
					onkeydown={handleKeydown}
					placeholder="Ask Maestro..."
					size="sm"
					class="flex-1"
				/>
				<Button
					intent="ghost"
					size="sm"
					class="h-7 w-7 shrink-0 rounded-full"
					onclick={sendMessage}
					disabled={!canSend}
					title={platformState.isReady ? "Send" : "Waiting for platform..."}
				>
					<Send size={12} />
				</Button>
			</div>
		{/if}
	</div>
</div>
{/if}
