<!--
	@component Inline Message
	@kind inline-message
	@layer component
	@category feedback
	@description Compact contextual message displayed adjacent to a form field or content area
	@container false
	@compound true
	@blockCategory feedback
	@defaultStyle inline-message-default
	@styleIds inline-message-default, inline-message-info, inline-message-success, inline-message-warning, inline-message-error
	@requiredAxes color, typography
	@slots root:all, icon:none, content:none
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
import { useInlineMessage } from "$lib/design/behaviors/inline-message/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { InlineMessageProps, InlineMessageTone } from "./types.js";

const TONE_PRESETS: Record<InlineMessageTone, string> = {
	info: "inline-message-info",
	success: "inline-message-success",
	warning: "inline-message-warning",
	error: "inline-message-error",
	help: "inline-message-default",
};

let { tone = "info", children, class: className, ...rest }: InlineMessageProps = $props();

const msg = $derived(useInlineMessage({ tone }));
const m = $derived(renderForge({ kind: "inline-message", preset: "default" }));
</script>

<div
	{...msg.root}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	data-slot="root"
	data-tone={tone}
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
