<!--
	@component Chat Thread
	@kind chat-thread
	@layer block
	@category content
	@description Scrollable list of chat messages composed from ChatBubble components
	@container true
	@containerSlots content
	@compound false
	@blockCategory content
	@defaultStyle scroll-area-default
	@styleIds scroll-area-default
	@requiredAxes backgroundColor
	@slots root:all
-->
<script lang="ts">
import { KnowledgeDeck } from "$lib/design/blocks/knowledge/index.js";
import { ChatBubble } from "$lib/design/components/chat-bubble/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatThreadProps } from "./types.js";

let { messages, class: className }: ChatThreadProps = $props();

// Empty-state context frame — pushed onto knowledgeContext when
// the thread is empty so KnowledgeDeck pulls the chat-tagged
// catalog with `chat:empty` scope. When a message arrives, the
// deck unmounts, the frame pops, and the regular thread takes
// over. Ambient rotation every 60s while idle so users browsing
// the empty pane see variety.
const EMPTY_CONTEXT = {
	id: "chat-thread-empty",
	tool: "chat",
	scope: "chat:empty",
	preferred: "dyk" as const,
};
</script>

<div
	data-kind="chat-thread"
	data-slot="root"
	class={cn("flex flex-col gap-3 overflow-y-auto flex-1 px-4 py-3", className)}
>
	{#if messages.length === 0}
		<div class="chat-thread__empty">
			<KnowledgeDeck context={EMPTY_CONTEXT} refreshIntervalMs={60000} />
		</div>
	{:else}
		{#each messages as msg (msg.id)}
			<ChatBubble
				variant={msg.variant}
				author={msg.author}
				timestamp={msg.timestamp}
			>
				<Text size="sm">{msg.content}</Text>
			</ChatBubble>
		{/each}
	{/if}
</div>

<style>
	.chat-thread__empty {
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		min-height: 12rem;
		padding: clamp(1rem, 2vw, 2rem);
	}
</style>
