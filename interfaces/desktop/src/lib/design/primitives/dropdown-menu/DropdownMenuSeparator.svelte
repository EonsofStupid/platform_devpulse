<!--
	@component DropdownMenuSeparator
	@description Structural shell for dropdown-menu separator.
	Contract: kind="dropdown-menu", slot="separator", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DropdownMenuSeparatorProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuSeparatorProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuSeparator");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="separator"
	class={cn(className)}
>
	{@render children?.()}
</div>
