<!--
	@component Chat Top Bar
	@kind chat-topbar
	@layer component
	@category navigation
	@description Top bar for the chat frame with hub label, title, and window controls
	@container false
	@compound false
	@blockCategory navigation
	@defaultStyle chat-topbar-default
	@styleIds chat-topbar-default, chat-topbar-stark, chat-topbar-glass, chat-topbar-flat, chat-topbar-matte
	@requiredAxes backgroundColor, border, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.6)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.5106 0.0979 173.17 / 0.15)",
		"border-width": "0 0 0.0625rem 0"
	}
-->
<script lang="ts">
import { Minus, X } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import Heading from "$lib/design/components/heading/Heading.svelte";
import Text from "$lib/design/components/text/Text.svelte";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatTopBarProps } from "./types.js";

let {
	hubLabel,
	title,
	style,
	onMinimize,
	onClose,
	children,
	class: className,
	...rest
}: ChatTopBarProps = $props();

const m = $derived(renderForge({ kind: "chat-topbar", preset: "default" }));
</script>

<div
	role="banner"
	{...m.dataAttrs}
	data-slot="topbar"
	data-tauri-drag-region
	style={cssVarString(m.cssVars)}
	class={cn("flex items-center justify-between", className)}
	{...rest}
>
	<div class="flex items-center gap-2">
		{#if hubLabel}
			<Text size="xs" weight="semibold">{hubLabel}</Text>
		{/if}
		{#if title}
			<Heading level={6} size="xs">{title}</Heading>
		{/if}
	</div>
	<div class="flex items-center gap-1">
		{#if children}
			{@render children()}
		{/if}
		{#if onMinimize}
			<Button preset="ghost" size="sm" onclick={onMinimize}>
				<Minus size={14} />
			</Button>
		{/if}
		{#if onClose}
			<Button preset="ghost" size="sm" onclick={onClose}>
				<X size={14} />
			</Button>
		{/if}
	</div>
</div>
