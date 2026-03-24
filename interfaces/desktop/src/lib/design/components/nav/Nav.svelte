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
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { NavComponentProps } from "./types.js";

let {
	label,
	size = "md",
	orientation = "horizontal",
	children,
	class: className,
	...rest
}: NavComponentProps = $props();

const styleId = "nav-default";
</script>

<StyleMacro kind="nav" style={styleId}>
	<nav
		aria-label={label}
		data-kind="nav"
		data-slot="root"
		data-orientation={orientation}
		class={cn("flex", orientation === "vertical" ? "flex-col" : "flex-row", className)}
		{...rest}
	>
		{@render children?.()}
	</nav>
</StyleMacro>
