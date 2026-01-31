<!--
	@component SelectItem
	@description Structural selectable item for select.
	Contract: kind="select", slot="item"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SelectItemProps } from "./types.js";

	let { children, class: className, ...rest }: SelectItemProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectItem");
</script>

<div
	{...rest}
	data-kind="select"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</div>
