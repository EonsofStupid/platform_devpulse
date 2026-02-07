<!--
	@component ScrollAreaViewport
	@description Structural viewport for scrollable content.
	Contract: kind="scroll-area", slot="viewport"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ScrollAreaViewportProps } from "./types.js";

let { children, class: className, ...rest }: ScrollAreaViewportProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ScrollAreaViewport");
</script>

<div
	{...rest}
	data-kind="scroll-area"
	data-slot="viewport"
	class={cn(className)}
>
	{@render children?.()}
</div>
