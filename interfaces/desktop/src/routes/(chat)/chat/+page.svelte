<!--
  @file Clyffy Chat
  @route /chat
  @domain chat

  Message content ONLY — rendered inside ChatShell's ChatDashboard slot.
  All structural UI (frame, topbar, sidebar, footer, context panel) is
  provided by the (chat) layout shell. This page renders ONLY messages.

  Data flow: chatState (domain rune) → this page reads blockMessages → ChatThread renders
-->
<script lang="ts">
import { Sparkles } from "lucide-svelte";
import ChatThread from "$lib/design/blocks/chat/ChatThread.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { chatState } from "$lib/domains/chat/index.js";
</script>

{#if chatState.loading}
	<div class="flex items-center justify-center py-8 flex-1">
		<Text size="sm" preset="default">Loading messages...</Text>
	</div>
{:else if chatState.error}
	<div class="flex flex-col items-center justify-center gap-2 py-8 flex-1">
		<Text size="sm" preset="default">Failed to load messages</Text>
		<Text size="xs" preset="default">{chatState.error}</Text>
	</div>
{:else if chatState.blockMessages.length === 0}
	<div class="flex flex-col items-center justify-center py-8 gap-2 flex-1">
		<Sparkles size={24} class="text-[var(--accent-teal-main)] drop-shadow-[0_0_0.5rem_var(--accent-teal-glow)]" />
		<Text size="sm" preset="default">No messages yet. Start a conversation.</Text>
	</div>
{:else}
	<ChatThread messages={chatState.blockMessages} class="flex-1" />
{/if}
