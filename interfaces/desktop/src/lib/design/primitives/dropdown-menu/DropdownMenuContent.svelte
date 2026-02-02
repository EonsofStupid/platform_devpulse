<!--
	@component DropdownMenuContent
	@description Structural shell for dropdown-menu content.
	Contract: kind="dropdown-menu", slot="content", ariaStateProvider="meltui"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DropdownMenuContentProps } from "./types.js";
	import { getDropdownMenuContext } from "./context.js";

	let { children, class: className, ...rest }: DropdownMenuContentProps = $props();
	const ctx = getDropdownMenuContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DropdownMenuContent");
</script>

<div
	{...rest}
	data-kind="dropdown-menu"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
