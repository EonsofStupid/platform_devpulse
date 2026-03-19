<!--
	@component AccordionItem
	@kind accordion
	@layer components

	Accordion item wrapper — creates per-item transport from root context.
	Sets item context for AccordionTrigger and AccordionContent to consume.

	Two-level context pattern:
	1. Reads root AccordionTransport context
	2. Calls transport.getItem() with item metadata
	3. Sets AccordionItemTransport context for child sub-components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAccordionContext, setAccordionItemContext } from "./context.js";
import type { AccordionItemProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: AccordionItemProps = $props();

const transport = getAccordionContext();
const item = transport.getItem({
	get id() {
		return value;
	},
	get disabled() {
		return disabled;
	},
});
setAccordionItemContext(item);
</script>

<div
	class={cn(className)}
	data-kind="accordion"
	data-slot="item"
	data-state={item.states.isExpanded ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</div>
