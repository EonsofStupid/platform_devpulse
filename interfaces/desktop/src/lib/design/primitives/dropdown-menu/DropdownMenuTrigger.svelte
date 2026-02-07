<!--
	@component DropdownMenuTrigger
	@description Structural shell for dropdown-menu trigger.
	Contract: kind="dropdown-menu", slot="trigger", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { DropdownMenuTriggerProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuTriggerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuTrigger");
</script>

<button
	{...rest}
	data-kind="dropdown-menu"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
