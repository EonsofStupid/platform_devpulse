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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatBubbleProps } from "./types.js";

let {
	variant = "ai",
	author,
	timestamp,
	children,
	class: className,
	...rest
}: ChatBubbleProps = $props();

/** Map bubble variant to distinct presets — AI and user messages look different */
const VARIANT_PRESETS: Record<string, string> = {
	ai: "glass-deep",
	user: "neuro-minimal",
	system: "flat-minimal",
};

const m = $derived(
	renderForge({ kind: "chat-bubble", preset: VARIANT_PRESETS[variant] ?? "default" }),
);
</script>

<div
	{...m.dataAttrs}
	data-slot="root"
	data-variant={variant}
	style={cssVarString(m.cssVars)}
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
