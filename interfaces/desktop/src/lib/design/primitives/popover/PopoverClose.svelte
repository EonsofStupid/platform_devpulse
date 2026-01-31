<!--
	@component PopoverClose
	@description Structural close button for popover.
	Contract: kind="popover", slot="close"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { PopoverCloseProps } from "./types.js";

	let { children, class: className, ...rest }: PopoverCloseProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "PopoverClose");
</script>

<button
	{...rest}
	data-kind="popover"
	data-slot="close"
	class={cn(className)}
>
	{@render children?.()}
</button>
