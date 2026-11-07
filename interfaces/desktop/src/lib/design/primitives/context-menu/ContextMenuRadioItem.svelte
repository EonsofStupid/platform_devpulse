<!--
	@component ContextMenuRadioItem
	@description Structural selectable entry within a radio group for context-menu.
	Contract: kind="context-menu", slot="radio-item"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuRadioItemProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuRadioItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuRadioItem");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="radio-item"
	class={cn(className)}
>
	{@render children?.()}
</div>
