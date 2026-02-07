<!--
	@component MenubarItem
	@description Structural selectable menu entry.
	Contract: kind="menubar", slot="item"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { MenubarItemProps } from "./types.js";

let { children, class: className, ...rest }: MenubarItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarItem");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</div>
