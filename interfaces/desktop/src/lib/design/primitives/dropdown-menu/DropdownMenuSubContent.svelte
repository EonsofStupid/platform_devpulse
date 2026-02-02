<!--
	@component DropdownMenuSubContent
	@description Structural shell for dropdown-menu sub-content.
	Contract: kind="dropdown-menu", slot="sub-content", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DropdownMenuSubContentProps } from "./types.js";
	import { getDropdownMenuContext } from "./context.js";

	let { children, class: className, ...rest }: DropdownMenuSubContentProps = $props();
	const ctx = getDropdownMenuContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuSubContent");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="sub-content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
