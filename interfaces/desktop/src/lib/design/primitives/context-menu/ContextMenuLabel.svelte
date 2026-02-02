<!--
	@component ContextMenuLabel
	@description Structural non-interactive label for context-menu group.
	Contract: kind="context-menu", slot="label"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { ContextMenuLabelProps } from "./types.js";

	let { children, class: className, ...rest }: ContextMenuLabelProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuLabel");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="label"
	class={cn(className)}
>
	{@render children?.()}
</div>
