<!--
  @file Maestro Chat
  @route /chat
  @domain chat

  Cyberpunk HUD chat interface for the Maestro AI assistant.
  Built entirely from ColdLight central library components + chat blocks.
  Messages persist to LibSQL via Tauri IPC.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Sparkles } from "lucide-svelte";
import { ChatPanel, ThreadList } from "$lib/design/blocks/chat/index.js";
import type { ChatMessage as BlockChatMessage, ChatThread } from "$lib/design/blocks/chat/types.js";
import Card from "$lib/design/components/card/Card.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatMessage } from "$lib/sys/generated/chat.types.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let threads = $state<ChatThread[]>([
	{ id: "alpha", label: "ALPHA", active: true },
	{ id: "beta", label: "BETA", active: false },
	{ id: "gamma", label: "GAMMA", active: false },
]);

let activeThreadId = $state("alpha");
let messages = $state<ChatMessage[]>([]);
let loading = $state(true);
let sending = $state(false);

// Map IPC messages to block ChatMessage format
const blockMessages = $derived<BlockChatMessage[]>(
	messages.map((msg) => ({
		id: String(msg.id),
		variant: msg.role === "assistant" ? "ai" as const : "user" as const,
		author: msg.role === "assistant" ? "Maestro" : undefined,
		content: msg.content,
		timestamp: msg.created_at ? formatTime(msg.created_at) : undefined,
	})),
);

async function loadMessages(): Promise<void> {
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

loadMessages();

function selectThread(id: string): void {
	activeThreadId = id;
	threads = threads.map((t) => ({ ...t, active: t.id === id }));
}

async function sendMessage(content: string): Promise<void> {
	if (!content.trim() || sending) return;
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

function formatTime(epoch: number): string {
	if (epoch === 0) return "";
	const date = new Date(epoch * 1000);
	return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
</script>

<div class="flex h-full">
	<!-- Thread sidebar -->
	<Card preset="default" class="w-48 border-r border-[var(--border-subtle)] shrink-0">
		<ThreadList
			{threads}
			activeId={activeThreadId}
			onSelect={selectThread}
		/>
	</Card>

	<!-- Chat area -->
	<div class="flex-1 flex flex-col">
		{#if platformState.hasFailed}
			<div class="px-3 py-1.5 text-center border-b border-[var(--border-emphasis)]">
				<Text size="xs" class="text-[var(--text-accent)]">
					Platform degraded — some features may be unavailable
				</Text>
			</div>
		{:else if platformState.isBooting}
			<div class="px-3 py-1.5 text-center border-b border-[var(--border-subtle)]">
				<Text size="xs" class="text-[var(--color-teal-400)]">
					Platform starting up...
				</Text>
			</div>
		{/if}

		{#if loading}
			<div class="flex items-center justify-center py-8 flex-1">
				<Text size="sm" class="text-[var(--text-muted)]">Loading messages...</Text>
			</div>
		{:else if messages.length === 0}
			<div class="flex flex-col items-center justify-center py-8 gap-2 flex-1">
				<Sparkles size={24} class="text-[var(--color-teal-400)] drop-shadow-[0_0_8px_var(--accent-teal-glow)]" />
				<Text size="sm" class="text-[var(--text-muted)]">No messages yet. Start a conversation.</Text>
			</div>
		{:else}
			<ChatPanel
				title="Task_AI"
				messages={blockMessages}
				onSend={sendMessage}
				class="flex-1"
			/>
		{/if}
	</div>

	<!-- Right panel — context visualization placeholder -->
	<Card preset="ghost" class="w-72 border-l border-[var(--border-subtle)] shrink-0 hidden lg:flex flex-col items-center justify-center">
		<Text size="sm" class="text-[var(--text-muted)]">Context visualization</Text>
	</Card>
</div>
