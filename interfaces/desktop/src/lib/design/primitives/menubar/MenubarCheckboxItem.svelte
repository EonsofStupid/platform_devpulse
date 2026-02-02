<!--
	@component MenubarCheckboxItem
	@description Structural toggleable menu entry with checked state.
	Contract: kind="menubar", slot="checkbox-item"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { MenubarCheckboxItemProps } from "./types.js";

	let { children, class: className, ...rest }: MenubarCheckboxItemProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarCheckboxItem");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="checkbox-item"
	class={cn(className)}
>
	{@render children?.()}
</div>
