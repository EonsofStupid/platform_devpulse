<!--
	@component Chat Context Panel
	@kind chat-context-panel
	@layer component
	@category content
	@description Side panel for cortex memory visualization in the chat frame
	@container true
	@containerSlots content
	@compound false
	@blockCategory content
	@defaultStyle chat-context-panel-default
	@styleIds chat-context-panel-default, chat-context-panel-stark, chat-context-panel-glass, chat-context-panel-flat, chat-context-panel-matte
	@requiredAxes backgroundColor, border, color, opacity
	@slots root:all
	@defaults {
		"background-color": "var(--surface-base)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0 0 0 0.0625rem"
	}
-->
<script lang="ts">
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatContextPanelProps } from "./types.js";

let {
	collapsed = false,
	style,
	children,
	class: className,
	...rest
}: ChatContextPanelProps = $props();

// "default" resolves --style-chat-context-panel-default-* (the documented @defaults).
const m = $derived(renderForge({ kind: "chat-context-panel", preset: "default" }));
</script>

<aside
	aria-label="Cortex memory"
	{...m.dataAttrs}
	data-slot="context-panel"
	data-collapsed={String(collapsed)}
	style={cssVarString(m.cssVars)}
	class={cn("overflow-hidden", className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<Text size="sm">Cortex visualization</Text>
	{/if}
</aside>
