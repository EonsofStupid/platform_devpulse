<!--
	@component ScrollAreaScrollbar
	@description Structural scrollbar track for scroll area.
	Contract: kind="scroll-area", slot="scrollbar"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ScrollAreaScrollbarProps } from "./types.js";

let {
	orientation = "vertical",
	children,
	class: className,
	...rest
}: ScrollAreaScrollbarProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ScrollAreaScrollbar");
</script>

<div
	{...rest}
	data-kind="scroll-area"
	data-slot="scrollbar"
	data-orientation={orientation}
	class={cn(className)}
>
	{@render children?.()}
</div>
