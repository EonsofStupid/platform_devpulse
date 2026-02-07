<!--
	@component DropdownMenuLabel
	@description Structural shell for dropdown-menu label.
	Contract: kind="dropdown-menu", slot="label", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DropdownMenuLabelProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuLabelProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuLabel");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="label"
	class={cn(className)}
>
	{@render children?.()}
</div>
