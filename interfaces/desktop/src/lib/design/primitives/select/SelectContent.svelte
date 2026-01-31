<!--
	@component SelectContent
	@description Structural dropdown content for select.
	Contract: kind="select", slot="content"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { SelectContentProps } from "./types.js";
	import { getSelectContext } from "./context.js";

	let { children, class: className, ...rest }: SelectContentProps = $props();

	const ctx = getSelectContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectContent");
</script>

<div
	{...rest}
	data-kind="select"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
