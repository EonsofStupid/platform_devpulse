<!--
	@component TooltipContent
	@description Structural floating content for tooltip.
	Contract: kind="tooltip", slot="content"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { TooltipContentProps } from "./types.js";
	import { getTooltipContext } from "./context.js";

	let { children, class: className, ...rest }: TooltipContentProps = $props();

	const ctx = getTooltipContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TooltipContent");
</script>

<div
	{...rest}
	data-kind="tooltip"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
