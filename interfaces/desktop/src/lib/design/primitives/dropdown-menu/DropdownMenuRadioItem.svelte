<!--
	@component DropdownMenuRadioItem
	@description Structural shell for dropdown-menu radio-item.
	Contract: kind="dropdown-menu", slot="radio-item", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DropdownMenuRadioItemProps } from "./types.js";

	let { children, class: className, ...rest }: DropdownMenuRadioItemProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuRadioItem");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="radio-item"
	class={cn(className)}
>
	{@render children?.()}
</div>
