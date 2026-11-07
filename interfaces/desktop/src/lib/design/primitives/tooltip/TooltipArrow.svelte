<!--
	@component TooltipArrow
	@description Structural arrow for tooltip.
	Contract: kind="tooltip", slot="arrow"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { TooltipArrowProps } from "./types.js";

let { children, class: className, ...rest }: TooltipArrowProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TooltipArrow");
</script>

<div
	{...rest}
	data-kind="tooltip"
	data-slot="arrow"
	class={cn(className)}
>
	{@render children?.()}
</div>
