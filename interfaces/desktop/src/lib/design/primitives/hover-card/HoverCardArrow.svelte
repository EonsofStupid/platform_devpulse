<!--
	@component HoverCardArrow
	@description Structural shell for hover-card arrow.
	Contract: kind="hover-card", slot="arrow", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { HoverCardArrowProps } from "./types.js";

	let { children, class: className, ...rest }: HoverCardArrowProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "HoverCardArrow");
</script>

<div
	{...rest}
	data-kind="hover-card"
	data-slot="arrow"
	class={cn(className)}
>
	{@render children?.()}
</div>
