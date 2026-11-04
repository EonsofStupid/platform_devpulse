<!--
  @component MessageBubble — token-driven bubble (util + renderForge only)
-->
<script lang="ts">
import * as Collapsible from "@devpulse/coldlight/components/collapsible";
import { Text } from "@devpulse/coldlight/components/text";
import { cssVarString, renderForge } from "@devpulse/coldlight/renderforge";
import { cn } from "@devpulse/coldlight/utils";
import type { PresetId } from "@devpulse/coldlight/visual";
import type { BlockChatMessage, ChatMode } from "../util/chat.types.js";

interface Props {
	message: BlockChatMessage;
	mode: ChatMode;
	class?: string;
}

let { message, mode, class: className }: Props = $props();

function bubblePreset(m: BlockChatMessage, chatMode: ChatMode): PresetId {
	if (m.variant === "user") return "chat-bubble-user";
	if (m.variant === "system") return "chat-bubble-system";
	switch (chatMode) {
		case "planning":
			return "chat-bubble-ai-planning";
		case "image":
			return "chat-bubble-ai-image";
		case "general":
			return "chat-bubble-ai-general";
		default:
			return "chat-bubble-ai-developer";
	}
}

const preset = $derived(bubblePreset(message, mode));
const m = $derived(renderForge({ kind: "chat-bubble", preset, state: "default" }));
const growOnce = "animate-[cl-grow_200ms_ease-out_1_both]";
</script>

<div
	{...m.dataAttrs}
	data-slot="root"
	data-variant={message.variant}
	style={cssVarString(m.cssVars)}
	class={cn("flex flex-col gap-1 px-4 py-3", growOnce, className)}
>
	{#if message.author || message.timestamp}
		<div class="flex items-center justify-between gap-2">
			{#if message.author}
				<Text size="xs" weight="semibold" class="text-[var(--text-accent)]">{message.author}</Text>
			{/if}
			{#if message.timestamp}
				<Text size="xs" class="text-[var(--text-muted)]">{message.timestamp}</Text>
			{/if}
		</div>
	{/if}
	<div data-slot="content">
		<Text size="sm" class="whitespace-pre-wrap">{message.content}</Text>
	</div>
	{#if message.structured && message.structuredLabel}
		<Collapsible.Root>
			<Collapsible.Trigger>{message.structuredLabel}</Collapsible.Trigger>
			<Collapsible.Content>
				<Text size="xs" class="whitespace-pre-wrap break-words">{message.structured}</Text>
			</Collapsible.Content>
		</Collapsible.Root>
	{/if}
</div>
