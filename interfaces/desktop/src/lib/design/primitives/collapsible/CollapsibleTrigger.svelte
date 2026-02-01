<!--
	@component CollapsibleTrigger
	@description Structural trigger button for collapsible.
	Contract: kind="collapsible", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CollapsibleTriggerProps } from "./types.js";
	import { getCollapsibleContext } from "./context.js";

	let { children, class: className, ...rest }: CollapsibleTriggerProps = $props();
	const ctx = getCollapsibleContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CollapsibleTrigger");
</script>

<button
	{...rest}
	data-kind="collapsible"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</button>
