<!--
	@component DropdownMenuGroup
	@description Structural shell for dropdown-menu group.
	Contract: kind="dropdown-menu", slot="group", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DropdownMenuGroupProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuGroup");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
