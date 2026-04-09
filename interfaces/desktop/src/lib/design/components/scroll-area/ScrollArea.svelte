<!--
	@component Scroll Area
	@kind scroll-area
	@layer component
	@category structural
	@description Custom scrollable container with styled scrollbars and overflow management
	@container true
	@containerSlots root
	@compound true
	@blockCategory layout
	@defaultStyle scroll-area-default
	@styleIds scroll-area-default
	@requiredAxes backgroundColor, borderRadius
	@slots root:all, viewport:none, scrollbar:none, thumb:none
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
import { useScrollArea } from "$lib/design/behaviors/interaction/scroll-area/index.js";
import { scrollAreaAnatomy } from "$lib/design/primitives/scroll-area/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ScrollAreaComponentProps } from "./types.js";

let {
	size = "md",
	orientation = "vertical",
	preset = "default",
	label,
	children,
	class: className,
	...rest
}: ScrollAreaComponentProps = $props();
const scrollArea = $derived(useScrollArea({ label, orientation }));
const m = $derived(renderForge({ kind: "scroll-area", preset }));
</script>
<div {...scrollAreaAnatomy.attrs.root} {...scrollArea.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} class={cn("relative overflow-hidden", className)} {...rest}>
		<div data-kind="scroll-area" data-slot="viewport" class="h-full w-full overflow-auto">{@render children?.()}</div>
	</div>
