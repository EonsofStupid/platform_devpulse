<!--
	@component MenubarRadioItem
	@description Structural selectable entry within a radio group.
	Contract: kind="menubar", slot="radio-item"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { MenubarRadioItemProps } from "./types.js";

let { children, class: className, ...rest }: MenubarRadioItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarRadioItem");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="radio-item"
	class={cn(className)}
>
	{@render children?.()}
</div>
