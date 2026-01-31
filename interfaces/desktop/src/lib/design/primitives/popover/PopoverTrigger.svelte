<!--
	@component PopoverTrigger
	@description Structural trigger button for popover.
	Contract: kind="popover", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PopoverTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: PopoverTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PopoverTrigger");
</script>

<button
	{...rest}
	data-kind="popover"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
