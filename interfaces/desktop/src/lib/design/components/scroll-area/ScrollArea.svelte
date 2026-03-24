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
-->
<script lang="ts">
import { useScrollArea } from "$lib/design/primitives/scroll-area/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ScrollAreaComponentProps } from "./types.js";
let { size = "md", orientation = "vertical", label, children, class: className, ...rest }: ScrollAreaComponentProps = $props();
const scrollArea = $derived(useScrollArea({ label, orientation }));
const styleId = "scroll-area-default";
</script>
<StyleMacro kind="scroll-area" style={styleId}>
	<div {...scrollArea.root} data-kind="scroll-area" data-slot="root" class={cn("relative overflow-hidden", className)} {...rest}>
		<div data-kind="scroll-area" data-slot="viewport" class="h-full w-full overflow-auto">{@render children?.()}</div>
	</div>
</StyleMacro>
