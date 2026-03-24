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
import { ChatBubble } from "$lib/design/components/chat-bubble/index.js";
import Text from "$lib/design/components/text/Text.svelte";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatThreadProps } from "./types.js";

let {
	messages,
	class: className,
}: ChatThreadProps = $props();
</script>

<div
	data-kind="chat-thread"
	data-slot="root"
	class={cn("flex flex-col gap-3 overflow-y-auto flex-1 px-4 py-3", className)}
>
	{#each messages as msg (msg.id)}
		<ChatBubble
			variant={msg.variant}
			author={msg.author}
			timestamp={msg.timestamp}
		>
			<Text size="sm">{msg.content}</Text>
		</ChatBubble>
	{/each}
</div>
