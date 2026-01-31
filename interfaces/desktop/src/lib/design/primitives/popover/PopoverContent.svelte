<!--
	@component PopoverContent
	@description Structural floating content panel for popover.
	Contract: kind="popover", slot="content"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PopoverContentProps } from "./types.js";
	import { getPopoverContext } from "./context.js";

	let { children, class: className, ...rest }: PopoverContentProps = $props();

	const ctx = getPopoverContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PopoverContent");
</script>

<div
	{...rest}
	data-kind="popover"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
