<!--
	@component DropdownMenuSubTrigger
	@description Structural shell for dropdown-menu sub-trigger.
	Contract: kind="dropdown-menu", slot="sub-trigger", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DropdownMenuSubTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: DropdownMenuSubTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuSubTrigger");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="sub-trigger"
	class={cn(className)}
>
	{@render children?.()}
</div>
