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
import { ChatBubble } from "#coldlight/components/chat-bubble/index.js";
import Text from "#coldlight/components/text/Text.svelte";
import { cn } from "#coldlight/utils/cn.js";
import type { ChatThreadProps } from "./types.js";

// `empty` is what the host shows while the thread has no messages
// (a chat feature passes its knowledge deck); ColdLight renders it and
// imports nothing from the app.
let { messages, empty, class: className }: ChatThreadProps = $props();
</script>

<div
	data-kind="chat-thread"
	data-slot="root"
	class={cn("flex flex-col gap-3 overflow-y-auto flex-1 px-4 py-3", className)}
>
	{#if messages.length === 0}
		{#if empty}
			<div class="chat-thread__empty">
				{@render empty()}
			</div>
		{/if}
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
