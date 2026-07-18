<!--
	@component Toolbar
	@kind toolbar
	@layer component
	@category structural
	@description Horizontal grouping of action buttons and controls with keyboard arrow navigation
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
	@container true
	@containerSlots root
	@compound true
	@blockCategory layout
	@defaultStyle toolbar-default
	@styleIds toolbar-default
	@requiredAxes backgroundColor, border, borderRadius
	@slots root:all, group:none, separator:none
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
import { toolbarAnatomy } from "$lib/design/behaviors/navigation/toolbar/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToolbarComponentProps } from "./types.js";

let {
	size = "md",
	orientation = "horizontal",
	label,
	disabled = false,
	loop = true,
	children,
	preset = "default",
	class: className,
	...rest
}: ToolbarComponentProps = $props();
const m = $derived(renderForge({ kind: "toolbar", preset }));
</script>

<div
		role="toolbar"
		aria-label={label}
		aria-orientation={orientation}
		aria-disabled={disabled || undefined}
		{...toolbarAnatomy.attrs.root}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-orientation={orientation}
		class={cn("flex items-center gap-1", orientation === "vertical" ? "flex-col" : "flex-row", disabled && "opacity-50 pointer-events-none", className)}
		{...rest}
	>
		{@render children?.()}
	</div>
