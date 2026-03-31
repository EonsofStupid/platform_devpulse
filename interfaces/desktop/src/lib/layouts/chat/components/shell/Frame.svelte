<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame

  Chat window layout — single-column grid (topbar, messages, footer).
  Sidebar (projects) and context panel (cortex viz) are separate OS child windows
  per cockpit architecture — NOT grid columns in the chat.

  Data flow: chatState (domain) → this shell (wires callbacks) → route page (renders messages)
  Rendered in a separate Tauri child window via open_chat_window.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import type { Snippet } from "svelte";
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
</script>

<ChatFrame state={frameState} engaged={true}>
	<ChatTopBar
		hubLabel={globalState.current_domain.toUpperCase()}
		title="CORTEX MEMORY"
		onMinimize={handleMinimize}
		onClose={handleClose}
	/>

	<ChatDashboard>
		{@render children()}
	</ChatDashboard>

	<ChatFooter
		onSend={handleSendMessage}
		disabled={chatState.sending}
	/>
</ChatFrame>
