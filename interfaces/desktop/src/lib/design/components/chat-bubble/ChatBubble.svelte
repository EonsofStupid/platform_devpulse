<!--
	@component Chat Bubble
	@kind chat-bubble
	@layer component
	@category content
	@description Message bubble for AI, user, or system messages in chat interfaces
	@container true
	@containerSlots content
	@compound false
	@blockCategory content
	@defaultStyle chat-bubble-ai
	@styleIds chat-bubble-ai, chat-bubble-user, chat-bubble-system
	@requiredAxes backgroundColor, border, borderRadius, shadow, color
	@slots root:all
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import Text from "$lib/design/components/text/Text.svelte";
import type { ChatBubbleProps } from "./types.js";

let {
	variant = "ai",
	author,
	timestamp,
	children,
	class: className,
	...rest
}: ChatBubbleProps = $props();

const styleId = $derived(`chat-bubble-${variant}`);
</script>

<StyleMacro kind="chat-bubble" style={styleId}>
	<div
		data-kind="chat-bubble"
		data-slot="root"
		data-variant={variant}
		class={cn("flex flex-col gap-1 px-4 py-3", className)}
		{...rest}
	>
		{#if author || timestamp}
			<div class="flex items-center justify-between gap-2">
				{#if author}
					<Text size="xs" weight="semibold" class="text-[var(--text-accent)]">{author}</Text>
				{/if}
				{#if timestamp}
					<Text size="xs" class="text-[var(--text-muted)]">{timestamp}</Text>
				{/if}
			</div>
		{/if}
		<div data-slot="content">
			{@render children?.()}
		</div>
	</div>
</StyleMacro>
