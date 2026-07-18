<!--
	@component Callout
	@kind callout
	@layer component
	@category feedback
	@description Highlighted block drawing attention to supplementary or important information
	@container true
	@containerSlots content
	@compound true
	@blockCategory feedback
	@defaultStyle callout-default
	@styleIds callout-default, callout-info, callout-success, callout-warning, callout-error
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, icon:none, content:none
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
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { CalloutProps } from "./types.js";

let {
	variant = "info",
	preset = "default",
	children,
	class: className,
	...rest
}: CalloutProps = $props();

const m = $derived(renderForge({ kind: "callout", preset }));
</script>

<div
	{...m.dataAttrs}
	data-slot="root"
	data-variant={variant}
	style={cssVarString(m.cssVars)}
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
