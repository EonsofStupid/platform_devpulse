<!--
	@component ScrollAreaThumb
	@description Structural scrollbar thumb for scroll area.
	Contract: kind="scroll-area", slot="thumb"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ScrollAreaThumbProps } from "./types.js";

	let { children, class: className, ...rest }: ScrollAreaThumbProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ScrollAreaThumb");
</script>

<div
	{...rest}
	data-kind="scroll-area"
	data-slot="thumb"
	class={cn(className)}
>
	{@render children?.()}
</div>
