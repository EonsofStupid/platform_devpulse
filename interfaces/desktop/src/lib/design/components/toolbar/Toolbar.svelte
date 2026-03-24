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
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ToolbarComponentProps } from "./types.js";

let {
	size = "md",
	orientation = "horizontal",
	label,
	disabled = false,
	loop = true,
	children,
	class: className,
	...rest
}: ToolbarComponentProps = $props();

const styleId = "toolbar-default";
</script>

<StyleMacro kind="toolbar" style={styleId}>
	<div
		role="toolbar"
		aria-label={label}
		aria-orientation={orientation}
		aria-disabled={disabled || undefined}
		data-kind="toolbar"
		data-slot="root"
		data-orientation={orientation}
		class={cn("flex items-center gap-1", orientation === "vertical" ? "flex-col" : "flex-row", disabled && "opacity-50 pointer-events-none", className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
