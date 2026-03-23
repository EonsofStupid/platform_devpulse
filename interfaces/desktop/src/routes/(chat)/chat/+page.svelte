<!--
  @file Maestro Chat
  @route /chat
  @domain chat

  Cyberpunk HUD chat interface for the Maestro AI assistant.
  Uses ColdLight glass surfaces, glow borders, and depth encoding.
  Renders in a separate Tauri window (450x600).
  Messages persist to LibSQL via Tauri IPC.

  All color references use token TW utilities (border-border-soft, text-text-link, text-purple-300).
  Zero hardcoded oklch values.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Mic, Send, Sparkles } from "lucide-svelte";
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

interface Thread {
	id: string;
	label: string;
	active: boolean;
}

let threads = $state<Thread[]>([
	{ id: "alpha", label: "ALPHA", active: true },
	{ id: "beta", label: "BETA", active: false },
	{ id: "gamma", label: "GAMMA", active: false },
]);

let messages = $state<ChatMessage[]>([]);
let loading = $state(true);
let inputValue = $state("");
let sending = $state(false);
const canSend = $derived(platformState.isReady && inputValue.trim().length > 0 && !sending);

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

loadMessages();

function setActiveThread(id: string) {
	threads = threads.map((t) => ({ ...t, active: t.id === id }));
}

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

<div class={cn(box({}), "flex h-full gap-0")} data-kind="box" data-slot="root">
	<!-- Thread sidebar — glass panel with teal accent on active -->
	<div
		class={cn(box({}), "v-s0 v-d1 v-b1 v-f1 w-24 border-r border-border-subtle px-2 py-3")}
		data-kind="box"
		data-slot="root"
	>
		<div class={stack({ gap: "1" })}>
			{#each threads as thread (thread.id)}
				<Button
					intent="ghost"
					size="sm"
					surface={thread.active ? "glass-teal" : "transparent"}
					glow={thread.active ? "teal" : undefined}
					frame={thread.active ? "accent-teal" : undefined}
					radius="md"
					class="text-xs font-medium tracking-wider {thread.active ? 'text-teal-300' : 'text-text-muted'}"
					onclick={() => setActiveThread(thread.id)}
				>
					{thread.label}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Chat area -->
	<div class={cn(stack({}), "flex-1")}>
		{#if platformState.hasFailed}
			<div
				class={cn(box({}), "v-s0 v-f2 px-3 py-1.5 text-center text-xs border-b border-border-emphasis")}
				data-kind="box"
				data-slot="root"
			>
				<Text size="xs" color="accent">
					Platform degraded — some features may be unavailable
				</Text>
			</div>
		{:else if platformState.isBooting}
			<div
				class={cn(box({}), "v-s0 px-3 py-1.5 text-center text-xs border-b border-border-soft")}
				data-kind="box"
				data-slot="root"
			>
				<Text size="xs" class="text-teal-400">
					Platform starting up...
				</Text>
			</div>
		{/if}

		<!-- Messages -->
		<div class={cn(box({}), "flex-1 overflow-y-auto scrollbar-thin p-3")} data-kind="box" data-slot="root">
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
				<div class={stack({ gap: "3" })}>
					{#each messages as msg (msg.id)}
						<div class={cn(stack({ gap: "1" }), msg.role === "user" ? "items-end" : "")}>
							{#if msg.role === "assistant"}
								<!-- AI bubble — purple glass with purple glow -->
								<div
									class={cn(box({}), "v-s5 v-d2 v-b2 v-g3 v-f3 v-r3 max-w-[85%] px-4 py-3")}
									data-kind="box"
									data-slot="root"
								>
									<div class={cn(hstack({ gap: "1" }), "mb-1.5")}>
										<Sparkles size={12} class="text-purple-300 drop-shadow-[0_0_6px_var(--accent-purple-glow)]" />
										<Heading level={6} size="xs" class="font-display text-purple-300">Maestro</Heading>
									</div>
									<Text size="sm" class="whitespace-pre-wrap leading-relaxed text-text-primary">{msg.content}</Text>
								</div>
							{:else}
								<!-- User bubble — teal glass with teal glow -->
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

		<!-- Input area — glass panel with glow frame -->
		<div
			class={cn(hstack({ gap: "2", align: "center" }), "v-s3 v-d1 v-f4 border-t border-border-soft px-3 py-2")}
		>
			<Button
				intent="ghost"
				size="sm"
				glow="teal"
				frame="glow"
				radius="full"
				class="h-8 w-8 shrink-0"
				title="Voice input"
			>
				<Mic size={14} />
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
				class="h-8 w-8 shrink-0"
				onclick={sendMessage}
				disabled={!canSend}
				title={platformState.isReady ? "Send" : "Waiting for platform..."}
			>
				<Send size={14} />
			</Button>
		</div>
	</div>
</div>
