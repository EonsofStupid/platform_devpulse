<!--
	@component DropdownMenuItem
	@description Structural shell for dropdown-menu item.
	Contract: kind="dropdown-menu", slot="item", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DropdownMenuItemProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuItem");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</div>
