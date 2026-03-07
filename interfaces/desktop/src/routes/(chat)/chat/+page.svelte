<!--
  @file Maestro Chat
  @route /chat
  @domain chat

  Chat interface for the Maestro AI assistant.
  Uses ColdLight components with registered chat presets.
  Renders in a separate Tauri window (450x600).
  Messages persist to LibSQL via Tauri IPC.
-->
<script lang="ts">
	import { Send, Mic, Sparkles } from "lucide-svelte";
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

	// Load messages on mount
	async function loadMessages() {
		loading = true;
		try {
			const history = await invoke<ChatMessage[]>("load_recent");
			messages = history;
		} catch {
			// Platform may still be booting — retry after delay
			setTimeout(loadMessages, 2000);
		} finally {
			loading = false;
		}
	}

	// Auto-load on module init
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
			// Show error as system message
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

<Box class="flex h-full gap-0">
	<!-- Thread sidebar -->
	<Stack gap="1" class="w-24 border-r border-border-divider px-2 py-3 cl-chat-threads">
		{#each threads as thread (thread.id)}
			<Button
				intent="ghost"
				size="sm"
				surface={thread.active ? "glass-void" : undefined}
				glow={thread.active ? "teal" : undefined}
				radius="md"
				class="text-xs font-medium {thread.active ? 'text-teal-400' : 'text-text-muted'}"
				onclick={() => setActiveThread(thread.id)}
			>
				{thread.label}
			</Button>
		{/each}
	</Stack>

	<!-- Chat area -->
	<Stack class="flex-1">
		{#if platformState.hasFailed}
			<Box
				preset="banner-warning"
				radius="none"
				class="px-3 py-1.5 text-center text-xs border-b border-border-subtle"
			>
				<Text size="xs" color="accent">
					Platform degraded — some features may be unavailable
				</Text>
			</Box>
		{:else if platformState.isBooting}
			<Box
				preset="banner-warning"
				radius="none"
				class="px-3 py-1.5 text-center text-xs border-b border-border-subtle"
			>
				<Text size="xs" color="accent">
					Platform starting up...
				</Text>
			</Box>
		{/if}

		<!-- Messages -->
		<Box class="flex-1 overflow-y-auto scrollbar-thin p-3">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<Text size="sm" color="muted">Loading messages...</Text>
				</div>
			{:else if messages.length === 0}
				<div class="flex flex-col items-center justify-center py-8 gap-2">
					<Sparkles size={24} class="text-teal-400" />
					<Text size="sm" color="muted">No messages yet. Start a conversation.</Text>
				</div>
			{:else}
				<Stack gap="3">
					{#each messages as msg (msg.id)}
						<Stack gap="1" class={msg.role === "user" ? "items-end" : ""}>
							<Box
								preset={msg.role === "assistant" ? "chat-bubble-ai" : "chat-bubble-user"}
								radius="lg"
								frame="soft"
								class="max-w-[85%] px-3 py-2 {msg.role === 'assistant' ? 'cl-bubble-ai' : 'cl-bubble-user'}"
							>
								{#if msg.role === "assistant"}
									<HStack gap="1" class="mb-1">
										<Sparkles size={12} class="text-teal-400" />
										<Heading level={6} size="xs" class="font-display text-teal-400">Maestro</Heading>
									</HStack>
								{/if}
								<Text size="sm" class="whitespace-pre-wrap leading-relaxed">{msg.content}</Text>
							</Box>
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
			preset="shell-statusbar"
			class="border-t border-border-divider px-3 py-2 cl-chat-input"
		>
			<Button
				intent="ghost"
				size="sm"
				glow="teal"
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
				size="sm"
				class="flex-1"
			/>
			<Button
				intent="ghost"
				size="sm"
				glow={canSend ? "teal" : undefined}
				radius="full"
				class="h-8 w-8 shrink-0"
				onclick={sendMessage}
				disabled={!canSend}
				title={platformState.isReady ? "Send" : "Waiting for platform..."}
			>
				<Send size={14} />
			</Button>
		</HStack>
	</Stack>
</Box>
