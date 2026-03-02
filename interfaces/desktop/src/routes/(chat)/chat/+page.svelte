<!--
  @file Maestro Chat
  @route /chat
  @domain chat

  Chat interface for the Maestro AI assistant.
  Renders in a separate Tauri window (450x600).
-->
<script lang="ts">
	import { Send, Mic, Sparkles } from "lucide-svelte";
	import { platformHealth } from "$lib/sys/runes/health.svelte.js";

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

<div class="flex h-full gap-0">
	<!-- Thread sidebar -->
	<div class="flex w-24 flex-col gap-1 border-r border-border-divider px-2 py-3">
		{#each threads as thread (thread.id)}
			<button
				class="rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
				class:text-teal-400={thread.active}
				class:v-s1={thread.active}
				class:text-text-muted={!thread.active}
				style={thread.active ? "color: var(--color-teal-400); text-shadow: 0 0 8px oklch(0.55 0.18 180 / 0.4);" : "color: var(--text-muted);"}
				onclick={() => setActiveThread(thread.id)}
			>
				{thread.label}
			</button>
		{/each}
	</div>

	<!-- Chat area -->
	<div class="flex flex-1 flex-col">
		{#if !platformHealth.isHealthy && platformHealth.initialized}
			<div class="px-3 py-1.5 text-center text-xs" style="background: oklch(0.3 0.05 30 / 0.3); color: var(--signal-error); border-bottom: 1px solid var(--border-subtle);">
				Platform {platformHealth.status.toLowerCase()} — some features may be unavailable
			</div>
		{/if}
		<!-- Messages -->
		<div class="flex-1 overflow-y-auto scrollbar-thin p-3">
			<div class="flex flex-col gap-3">
				{#each messages as msg (msg.id)}
					<div class="flex flex-col gap-1" class:items-end={msg.role === "user"}>
						<div
							class="max-w-[85%] rounded-lg px-3 py-2 text-sm"
							class:v-s1={msg.role === "user"}
							class:v-s2={msg.role === "assistant"}
							style={msg.role === "user"
								? "border: 1px solid var(--border-subtle); color: var(--text-primary);"
								: "border: 1px solid var(--border-soft); color: var(--text-primary);"}
						>
							{#if msg.role === "assistant"}
								<div class="mb-1 flex items-center gap-1.5">
									<Sparkles size={12} style="color: var(--color-teal-400);" />
									<span class="text-xs font-semibold" style="color: var(--color-teal-400); font-family: var(--font-display);">Maestro</span>
								</div>
							{/if}
							<div class="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
						</div>
						<span class="px-1 text-xs" style="color: var(--text-muted);">{msg.timestamp}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Input -->
		<div class="flex items-center gap-2 border-t border-border-divider px-3 py-2 v-s2">
			<button
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
				style="color: var(--color-teal-400); background: oklch(0.55 0.18 180 / 0.08); border: 1px solid oklch(0.55 0.18 180 / 0.15);"
				title="Voice input"
			>
				<Mic size={14} />
			</button>
			<input
				type="text"
				bind:value={inputValue}
				onkeydown={handleKeydown}
				placeholder="Ask Maestro..."
				class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none"
				style="background: var(--matte-dark); border-color: var(--border-subtle); color: var(--text-primary); font-family: var(--font-sans);"
			/>
			<button
				class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
				style="color: var(--color-teal-400); background: oklch(0.55 0.18 180 / 0.1); border: 1px solid oklch(0.55 0.18 180 / 0.2); opacity: {canSend ? 1 : 0.4};"
				onclick={sendMessage}
				disabled={!canSend}
				title={platformHealth.isHealthy ? "Send" : "Waiting for platform..."}
			>
				<Send size={14} />
			</button>
		</div>
	</div>
</div>
