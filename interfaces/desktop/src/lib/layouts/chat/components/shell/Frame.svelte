<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame

  Chat window layout composition.
  Composes ColdLight central library components into the 5-zone grid shell.
  This is a LAYOUT — it wires state and composes components. Not a component itself.

  Rendered in a separate Tauri child window via open_chat_window.
-->
<script lang="ts">
import { invoke } from "@tauri-apps/api/core";
import type { Snippet } from "svelte";
import { ChatContextPanel } from "$lib/design/components/chat-context-panel/index.js";
import { ChatDashboard } from "$lib/design/components/chat-dashboard/index.js";
import { ChatFooter } from "$lib/design/components/chat-footer/index.js";
import { ChatFrame } from "$lib/design/components/chat-frame/index.js";
import { ChatSidebar } from "$lib/design/components/chat-sidebar/index.js";
import { ChatTopBar } from "$lib/design/components/chat-topbar/index.js";
import { globalState } from "$lib/sys/runes/global.svelte.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

const chatState = $derived(
	globalState.chat_minimized ? "minimized" : globalState.chat_open ? "open" : "closed",
);

function handleMinimize(): void {
	globalState.minimizeChat();
}

function handleClose(): void {
	invoke("close_window", { label: "chat" });
}

function handleModeChange(mode: "developer" | "planning" | "image" | "general"): void {
	globalState.setMode(mode);
}
</script>

<ChatFrame
	state={chatState}
	engaged={true}
	contextCollapsed={false}
>
	<ChatTopBar
		hubLabel={globalState.current_domain.toUpperCase()}
		title="CORTEX MEMORY"
		onMinimize={handleMinimize}
		onClose={handleClose}
	/>

	<ChatSidebar
		mode={globalState.chat_mode}
		onModeChange={handleModeChange}
	/>

	<ChatDashboard>
		{@render children()}
	</ChatDashboard>

	<ChatFooter disabled={false} />

	<ChatContextPanel collapsed={false} />
</ChatFrame>
