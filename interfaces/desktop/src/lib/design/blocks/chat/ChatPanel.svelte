<!--
	@component Chat Panel
	@kind chat-panel
	@layer block
	@category composite
	@description Full chat panel composing Card + ChatThread + ChatInput
	@container true
	@containerSlots content
	@compound true
	@blockCategory content
	@defaultStyle card-default
	@styleIds card-default
	@requiredAxes backgroundColor, border, borderRadius, shadow
	@slots root:all
-->
<script lang="ts">
import Card from "$lib/design/components/card/Card.svelte";
import Heading from "$lib/design/components/heading/Heading.svelte";
import Separator from "$lib/design/components/separator/Separator.svelte";
import { cn } from "$lib/design/utils/cn.js";
import ChatThread from "./ChatThread.svelte";
import ChatInput from "./ChatInput.svelte";
import type { ChatPanelProps } from "./types.js";

let {
	title,
	messages,
	onSend,
	onVoice,
	voiceActive = false,
	class: className,
}: ChatPanelProps = $props();
</script>

<Card variant="default" class={cn("flex flex-col h-full", className)}>
	{#if title}
		<div class="px-4 pt-3 pb-2">
			<Heading level={3} size="sm">{title}</Heading>
		</div>
		<Separator />
	{/if}

	<ChatThread {messages} class="flex-1" />

	<Separator />
	<ChatInput
		{onSend}
		{onVoice}
		{voiceActive}
	/>
</Card>
