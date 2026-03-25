<!--
	@component Chat Dashboard
	@kind chat-dashboard
	@layer component
	@category content
	@description Scrollable message area for the chat frame
	@container true
	@containerSlots content
	@compound false
	@blockCategory content
	@defaultStyle chat-dashboard-default
	@styleIds chat-dashboard-default, chat-dashboard-stark, chat-dashboard-glass, chat-dashboard-flat, chat-dashboard-matte
	@requiredAxes backgroundColor, color, opacity
	@slots root:all
	@defaults {
		"background-color": "oklch(0.0601 0.012 224.61 / 0.4)",
		"color": "oklch(0.9319 0.015 224)"
	}
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ChatDashboardProps } from "./types.js";

let {
	style,
	children,
	class: className,
	...rest
}: ChatDashboardProps = $props();

const styleId = $derived(`chat-dashboard-${style ?? "default"}`);
</script>

<StyleMacro kind="chat-dashboard" style={styleId}>
	<div
		role="log"
		aria-live="polite"
		aria-label="Chat messages"
		data-kind="chat-dashboard"
		data-slot="chat-dashboard"
		class={cn("flex flex-col overflow-y-auto scrollbar-thin", className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
