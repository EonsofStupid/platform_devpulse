<!--
  @file ChatOverlay — Draggable floating chat panel
  @layer lib
  @package @devpulse/layouts/app

  Embeds the Maestro chat as a draggable overlay within the main app window.
  Toggle via Ctrl+Shift+C. Draggable by the title bar.
-->
<script lang="ts">
import { Send, Mic, Sparkles, X, Minus, GripVertical } from "lucide-svelte";
import { invoke } from "@tauri-apps/api/core";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";
import type { ChatMessage } from "$lib/sys/generated/chat.types.js";
import {
	Box,
	Button,
	Text,
	Heading,
	HStack,
	Stack,
	Input,
} from "$lib/design/index.js";

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
	<Box
		surface="glass-deep"
		depth="z2"
		bevel="soft"
		glow="teal"
		frame="accent-teal"
		radius="lg"
		class="flex flex-col overflow-hidden shadow-[0_8px_32px_rgb(0_0_0/0.5)] {minimized ? 'h-auto' : 'h-[520px]'}"
	>
		<!-- Draggable title bar -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="flex items-center justify-between px-3 py-2 border-b border-border-soft cursor-move select-none"
			onmousedown={onDragStart}
		>
			<HStack gap="2" align="center">
				<GripVertical size={12} class="text-text-muted" />
				<Sparkles size={14} class="text-teal-400 drop-shadow-[0_0_6px_var(--accent-teal-glow)]" />
				<Heading level={6} size="xs" class="font-display text-teal-300">Maestro</Heading>
			</HStack>
			<HStack gap="1">
				<Button
					intent="ghost"
					size="sm"
					radius="full"
					class="h-6 w-6"
					onclick={() => (minimized = !minimized)}
					title={minimized ? "Expand" : "Minimize"}
				>
					<Minus size={12} />
				</Button>
				<Button
					intent="ghost"
					size="sm"
					radius="full"
					class="h-6 w-6"
					onclick={() => (open = false)}
					title="Close"
				>
					<X size={12} />
				</Button>
			</HStack>
		</div>

		{#if !minimized}
			<!-- Messages -->
			<Box class="flex-1 overflow-y-auto scrollbar-thin p-3">
				{#if loading}
					<div class="flex items-center justify-center py-8">
						<Text size="sm" color="muted">Loading messages...</Text>
					</div>
				{:else if messages.length === 0}
					<div class="flex flex-col items-center justify-center py-8 gap-2">
						<Sparkles size={24} class="text-teal-400 drop-shadow-[0_0_8px_var(--accent-teal-glow)]" />
						<Text size="sm" color="muted">No messages yet. Start a conversation.</Text>
					</div>
				{:else}
					<Stack gap="3">
						{#each messages as msg (msg.id)}
							<Stack gap="1" class={msg.role === "user" ? "items-end" : ""}>
								{#if msg.role === "assistant"}
									<Box
										surface="glass-purple"
										depth="z2"
										bevel="soft"
										glow="purple"
										frame="accent-purple"
										radius="lg"
										class="max-w-[85%] px-4 py-3"
									>
										<HStack gap="1" class="mb-1.5">
											<Sparkles size={12} class="text-purple-300 drop-shadow-[0_0_6px_var(--accent-purple-glow)]" />
											<Heading level={6} size="xs" class="font-display text-purple-300">Maestro</Heading>
										</HStack>
										<Text size="sm" class="whitespace-pre-wrap leading-relaxed text-text-primary">{msg.content}</Text>
									</Box>
								{:else}
									<Box
										surface="glass-teal"
										depth="z2"
										bevel="soft"
										glow="teal"
										frame="accent-teal"
										radius="lg"
										class="max-w-[85%] px-4 py-3"
									>
										<Text size="sm" class="whitespace-pre-wrap leading-relaxed text-text-primary">{msg.content}</Text>
									</Box>
								{/if}
								<Text size="xs" color="muted" class="px-1">{formatTime(msg.created_at)}</Text>
							</Stack>
						{/each}
					</Stack>
				{/if}
			</Box>

			<!-- Input area -->
			<HStack
				gap="2"
				align="center"
				surface="glass-deep"
				depth="z1"
				frame="glow"
				class="border-t border-border-soft px-3 py-2"
			>
				<Button
					intent="ghost"
					size="sm"
					glow="teal"
					frame="glow"
					radius="full"
					class="h-7 w-7 shrink-0"
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
					preset="chat-input"
					surface="glass-void"
					frame="soft"
					size="sm"
					class="flex-1"
				/>
				<Button
					intent="ghost"
					size="sm"
					glow={canSend ? "teal" : undefined}
					frame={canSend ? "glow" : undefined}
					radius="full"
					class="h-7 w-7 shrink-0"
					onclick={sendMessage}
					disabled={!canSend}
					title={platformState.isReady ? "Send" : "Waiting for platform..."}
				>
					<Send size={12} />
				</Button>
			</HStack>
		{/if}
	</Box>
</div>
{/if}
