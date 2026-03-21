<!--
	@component Accordion.Item
	@kind accordion
	@slot item
	@layer components

	Wraps a single accordion section. Sets item context for Trigger/Content.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAccordionContext, setAccordionItemContext } from "./context.js";
import type { AccordionItemProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: AccordionItemProps = $props();
const ctx = getAccordionContext();

setAccordionItemContext({
	get value() { return value; },
	get disabled() { return disabled; },
});

const itemAttrs = $derived(ctx.hook.getItem(value));
</script>

<div
	{...itemAttrs}
	id={ctx.ids.item?.(value)}
	class={cn(ctx.classes.item, className)}
>
	{@render children?.()}
</div>
