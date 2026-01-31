<!--
	@component TooltipTrigger
	@description Structural trigger for tooltip.
	Contract: kind="tooltip", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { TooltipTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: TooltipTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TooltipTrigger");
</script>

<button
	{...rest}
	data-kind="tooltip"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
