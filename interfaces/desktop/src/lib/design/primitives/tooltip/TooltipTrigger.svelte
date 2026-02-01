<!--
	@component TooltipTrigger
	@description Structural trigger for tooltip.
	Contract: kind="tooltip", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { TooltipTriggerProps } from "./types.js";
	import { getTooltipContext } from "./context.js";

	let { children, class: className, ...rest }: TooltipTriggerProps = $props();
	const ctx = getTooltipContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TooltipTrigger");
</script>

<button
	{...rest}
	data-kind="tooltip"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</button>
