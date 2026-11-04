<!--
  @file src/lib/layouts/chat/components/shell/Frame.svelte
  @module @devpulse/layouts/chat/Frame

  Chat window layout — single-column grid (topbar, messages, footer).
  The chat is its own native OS window: the system title bar owns
  minimize, maximize and close. The TopBar adds buttons that open the
  peer windows (Knowledge Viewer, Model Control).

  Layout chrome only — message stream + composer live inside `ChatRoot` on the route.
-->
<script lang="ts">
import "../../styles/index.css";
import { Button } from "@devpulse/coldlight/components/button";
import { ChatDashboard } from "@devpulse/coldlight/components/chat-dashboard";
import { ChatFrame } from "@devpulse/coldlight/components/chat-frame";
import { ChatTopBar } from "@devpulse/coldlight/components/chat-topbar";
import { Brain, Cpu } from "lucide-svelte";
import type { Snippet } from "svelte";
import { openWindow, type WindowRole } from "$lib/sys/bindings/window/index.js";
import { logError } from "$lib/sys/logger.js";
import { globalState } from "$lib/sys/runes/global.svelte.js";

interface Props {
	children: Snippet;
}

let { children }: Props = $props();

async function open(role: WindowRole): Promise<void> {
	const result = await openWindow(role);
	if (result.status === "error") {
		logError("layouts.chat.Frame", `open ${role} window failed: ${result.error}`);
	}
}
</script>

<ChatFrame state="open" engaged={true}>
	<ChatTopBar hubLabel={globalState.current_domain.toUpperCase()} title="CHAT">
		{#snippet children()}
			<Button variant="ghost" size="sm" onclick={() => open("KnowledgeViewer")} title="Knowledge Viewer" aria-label="Open Knowledge Viewer">
				<Brain size={14} />
			</Button>
			<Button variant="ghost" size="sm" onclick={() => open("ModelLoader")} title="Model Control" aria-label="Open Model Control">
				<Cpu size={14} />
			</Button>
		{/snippet}
	</ChatTopBar>

	<ChatDashboard>
		{@render children()}
	</ChatDashboard>
</ChatFrame>
