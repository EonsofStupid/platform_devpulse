<!--
	@component AccordionTrigger
	@description Structural trigger button for accordion item.
	Contract: kind="accordion", slot="trigger"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AccordionTriggerProps } from "./types.js";
	import { getAccordionItemContext } from "./context.js";

	let { children, class: className, ...rest }: AccordionTriggerProps = $props();
	const ctx = getAccordionItemContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AccordionTrigger");
</script>

<button
	{...rest}
	data-kind="accordion"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</button>
