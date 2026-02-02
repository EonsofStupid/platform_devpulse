<!--
	@component DropdownMenuRadioGroup
	@description Structural shell for dropdown-menu radio-group.
	Contract: kind="dropdown-menu", slot="radio-group", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DropdownMenuRadioGroupProps } from "./types.js";

	let { children, class: className, ...rest }: DropdownMenuRadioGroupProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuRadioGroup");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="radio-group"
	class={cn(className)}
>
	{@render children?.()}
</div>
