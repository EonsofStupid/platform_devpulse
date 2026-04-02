<!--
	@component Chat Sidebar
	@kind chat-sidebar
	@layer component
	@category navigation
	@description Mode selector sidebar for switching between chat modes
	@container false
	@compound false
	@blockCategory navigation
	@defaultStyle chat-sidebar-default
	@styleIds chat-sidebar-default, chat-sidebar-stark, chat-sidebar-glass, chat-sidebar-flat, chat-sidebar-matte
	@requiredAxes backgroundColor, border, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.5)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.5106 0.0979 173.17 / 0.15)",
		"border-width": "0 0.0625rem 0 0"
	}
-->
<script lang="ts">
import { Button } from "$lib/design/components/button/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatMode, ChatSidebarProps } from "./types.js";

const MODE_LABELS: Record<ChatMode, string> = {
	developer: "DEV",
	planning: "PLAN",
	image: "IMG",
	general: "GEN",
};

let {
	mode = "general",
	availableModes = ["developer", "planning", "image", "general"],
	onModeChange,
	style,
	class: className,
	...rest
}: ChatSidebarProps = $props();

const m = $derived(renderForge({ kind: "chat-sidebar", preset: "default" }));
</script>

<nav
	aria-label="Chat modes"
	{...m.dataAttrs}
	data-slot="mode-selector"
	data-mode={mode}
	style={cssVarString(m.cssVars)}
	class={cn("flex flex-col items-center gap-2", className)}
	{...rest}
>
	{#each availableModes as m (m)}
		<Button
			preset={mode === m ? "primary" : "ghost"}
			size="sm"
			aria-pressed={mode === m}
			onclick={() => onModeChange?.(m)}
		>
			{MODE_LABELS[m]}
		</Button>
	{/each}
</nav>
