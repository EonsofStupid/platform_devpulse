<!--
	@component ScrollArea
	@description Structural root container for custom scroll area.
	Contract: kind="scroll-area", slot="root"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ScrollAreaProps } from "./types.js";

let { children, class: className, ...rest }: ScrollAreaProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ScrollArea");
</script>

<div
	{...rest}
	data-kind="scroll-area"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
