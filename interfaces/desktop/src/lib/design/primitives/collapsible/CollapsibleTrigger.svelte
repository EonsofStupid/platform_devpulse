<!--
	@component CollapsibleTrigger
	@description Structural trigger button for collapsible.
	Contract: kind="collapsible", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { CollapsibleTriggerProps } from "./types.js";

	let { children, class: className, ...rest }: CollapsibleTriggerProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "CollapsibleTrigger");
</script>

<button
	{...rest}
	data-kind="collapsible"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
