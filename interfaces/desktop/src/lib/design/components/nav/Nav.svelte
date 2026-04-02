<!--
	@component Nav
	@kind nav
	@layer component
	@category composite
	@description Vertical or horizontal navigation list for site or section-level wayfinding
	@container true
	@containerSlots root
	@compound true
	@blockCategory navigation
	@defaultStyle nav-default
	@styleIds nav-default
	@requiredAxes backgroundColor, border, color, typography
	@slots root:all, item:none, link:none, group:none, groupLabel:none
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
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { NavComponentProps } from "./types.js";

let {
	preset = "default",
	label,
	size = "md",
	orientation = "horizontal",
	children,
	class: className,
	...rest
}: NavComponentProps = $props();

const m = $derived(renderForge({ kind: "nav", preset }));
</script>

<nav
	aria-label={label}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	data-slot="root"
	data-orientation={orientation}
	class={cn("flex", orientation === "vertical" ? "flex-col" : "flex-row", className)}
	{...rest}
>
	{@render children?.()}
</nav>
