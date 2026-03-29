<!--
	@component Tooltip.Trigger
	@kind tooltip
	@slot trigger
	@layer components

	Element that triggers the tooltip on hover/focus. ARIA from hook.
-->
<script lang="ts">
import { tooltipAnatomy } from "$lib/design/primitives/tooltip/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getTooltipContext } from "./context.js";
import type { TooltipTriggerProps } from "./types.js";

let { children, class: className, ...rest }: TooltipTriggerProps = $props();
const ctx = getTooltipContext();
</script>

<div
	{...tooltipAnatomy.attrs.trigger}
	{...ctx.hook.trigger}
	{...rest}
	class={cn("inline-flex", className)}
>
	{@render children?.()}
</div>
