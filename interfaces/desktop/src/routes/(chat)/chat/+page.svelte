<!--
  @file Maestro Chat
  @route /chat
  @domain chat

  Chat interface for the Maestro AI assistant.
  Uses ColdLight components with registered chat presets.
  Renders in a separate Tauri window (450x600).
-->
<script lang="ts">
	import { Send, Mic, Sparkles } from "lucide-svelte";
	import { platformHealth } from "$lib/sys/runes/health.svelte.js";
	import {
		Box,
		Button,
		Text,
		Heading,
		HStack,
		Stack,
		Input,
		Badge,
	} from "$lib/design/index.js";

	interface ChatMessage {
		id: string;
		role: "user" | "assistant";
		content: string;
		timestamp: string;
	}

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

	let messages = $state<ChatMessage[]>([
		{
			id: "1",
			role: "user",
			content: "Analyze the current devpulse build pipeline and identify bottlenecks.",
			timestamp: "2:34 PM",
		},
		{
			id: "2",
			role: "assistant",
			content: "I've analyzed the build pipeline. Here are the findings:\n\n1. Token generation (SD5) — 2.1s avg, acceptable\n2. Vite HMR — 340ms, well within targets\n3. svelte-check — 8.2s, could benefit from incremental mode\n4. Type resolution in recipe system — minor delays from deep generic chains\n\nRecommendation: Enable incremental svelte-check and consider caching the token build output.",
			timestamp: "2:35 PM",
		},
	]);

	let inputValue = $state("");
	const canSend = $derived(platformHealth.isHealthy && inputValue.trim().length > 0);

	function setActiveThread(id: string) {
		threads = threads.map((t) => ({ ...t, active: t.id === id }));
	}

	function sendMessage() {
		if (!inputValue.trim()) return;
		messages = [
			...messages,
			{
				id: String(Date.now()),
				role: "user",
				content: inputValue.trim(),
				timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
			},
		];
		inputValue = "";
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<Box class="flex h-full gap-0">
	<!-- Thread sidebar -->
	<Stack gap="1" class="w-24 border-r border-border-divider px-2 py-3">
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
		{#if !platformHealth.isHealthy && platformHealth.initialized}
			<Box
				preset="banner-warning"
				radius="none"
				class="px-3 py-1.5 text-center text-xs border-b border-border-subtle"
			>
				<Text size="xs" color="accent">
					Platform {platformHealth.status.toLowerCase()} — some features may be unavailable
				</Text>
			</Box>
		{/if}

		<!-- Messages -->
		<Box class="flex-1 overflow-y-auto scrollbar-thin p-3">
			<Stack gap="3">
				{#each messages as msg (msg.id)}
					<Stack gap="1" class={msg.role === "user" ? "items-end" : ""}>
						<Box
							preset={msg.role === "assistant" ? "chat-bubble-ai" : "chat-bubble-user"}
							radius="lg"
							frame="soft"
							class="max-w-[85%] px-3 py-2"
						>
							{#if msg.role === "assistant"}
								<HStack gap="1" class="mb-1">
									<Sparkles size={12} class="text-teal-400" />
									<Heading level={6} size="xs" class="font-display text-teal-400">Maestro</Heading>
								</HStack>
							{/if}
							<Text size="sm" class="whitespace-pre-wrap leading-relaxed">{msg.content}</Text>
						</Box>
						<Text size="xs" color="muted" class="px-1">{msg.timestamp}</Text>
					</Stack>
				{/each}
			</Stack>
		</Box>

		<!-- Input area -->
		<HStack
			gap="2"
			align="center"
			preset="shell-statusbar"
			class="border-t border-border-divider px-3 py-2"
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
			<input
				type="text"
				bind:value={inputValue}
				onkeydown={handleKeydown}
				placeholder="Ask Maestro..."
				class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none"
				style="background: var(--matte-dark); border-color: var(--border-subtle); color: var(--text-primary);"
			/>
			<Button
				intent="ghost"
				size="sm"
				glow={canSend ? "teal" : undefined}
				radius="full"
				class="h-8 w-8 shrink-0"
				onclick={sendMessage}
				disabled={!canSend}
				title={platformHealth.isHealthy ? "Send" : "Waiting for platform..."}
			>
				<Send size={14} />
			</Button>
		</HStack>
	</Stack>
</Box>
