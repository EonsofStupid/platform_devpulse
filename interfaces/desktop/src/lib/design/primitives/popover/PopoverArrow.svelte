<!--
	@component PopoverArrow
	@description Structural arrow for popover.
	Contract: kind="popover", slot="arrow"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PopoverArrowProps } from "./types.js";

	let { children, class: className, ...rest }: PopoverArrowProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PopoverArrow");
</script>

<div
	{...rest}
	data-kind="popover"
	data-slot="arrow"
	class={cn(className)}
>
	{@render children?.()}
</div>
