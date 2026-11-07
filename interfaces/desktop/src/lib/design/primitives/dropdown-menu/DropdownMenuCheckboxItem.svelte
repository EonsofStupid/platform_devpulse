<!--
	@component DropdownMenuCheckboxItem
	@description Structural shell for dropdown-menu checkbox-item.
	Contract: kind="dropdown-menu", slot="checkbox-item", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DropdownMenuCheckboxItemProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuCheckboxItemProps = $props();

if (import.meta.env?.DEV)
	stripStyleProp(rest as Record<string, unknown>, "DropdownMenuCheckboxItem");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="checkbox-item"
	class={cn(className)}
>
	{@render children?.()}
</div>
