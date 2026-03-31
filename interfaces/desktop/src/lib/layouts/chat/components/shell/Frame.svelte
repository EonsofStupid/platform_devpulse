<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame

  Chat window layout — single-column grid (topbar, messages, footer).
  TopBar includes buttons to spawn peer child windows (CortexViewer, ModelLoader).
  Per cockpit architecture — these are separate OS windows, not grid columns.

  Data flow: chatState (domain) → this shell (wires callbacks) → route page (renders messages)
  Rendered in a separate Tauri child window via open_chat_window.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import { Brain, Cpu } from "lucide-svelte";
import type { Snippet } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { ChatDashboard } from "$lib/design/components/chat-dashboard/index.js";
import { ChatFooter } from "$lib/design/components/chat-footer/index.js";
import { ChatFrame } from "$lib/design/components/chat-frame/index.js";
import { ChatTopBar } from "$lib/design/components/chat-topbar/index.js";
import { chatState } from "$lib/domains/chat/index.js";
import { globalState } from "$lib/sys/runes/global.svelte.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const frameState = $derived<"open" | "minimized" | "closed">(
	globalState.chat_minimized ? "minimized" : "open",
);

$effect(() => {
	if (chatState.loading) {
		chatState.loadMessages();
	}
});

function handleSendMessage(content: string): void {
	chatState.sendMessage(content);
}

function handleMinimize(): void {
	globalState.minimizeChat();
}

function handleClose(): void {
	invoke("close_window", { label: "chat" });
}

function openCortexViewer(): void {
	invoke("open_window", { role: "CortexViewer" });
}

function openModelLoader(): void {
	invoke("open_window", { role: "ModelLoader" });
}
</script>

<ChatFrame state={frameState} engaged={true}>
	<ChatTopBar
		hubLabel={globalState.current_domain.toUpperCase()}
		title="CORTEX MEMORY"
		onMinimize={handleMinimize}
		onClose={handleClose}
	>
		{#snippet children()}
			<Button preset="ghost" size="sm" onclick={openCortexViewer} title="Cortex Viewer" aria-label="Open Cortex Viewer">
				<Brain size={14} />
			</Button>
			<Button preset="ghost" size="sm" onclick={openModelLoader} title="Model Control" aria-label="Open Model Control">
				<Cpu size={14} />
			</Button>
		{/snippet}
	</ChatTopBar>

	<ChatDashboard>
		{@render children()}
	</ChatDashboard>

	<ChatFooter
		onSend={handleSendMessage}
		disabled={chatState.sending}
	/>
</ChatFrame>
