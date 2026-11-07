<!--
	@component Accordion.Item
	@kind accordion
	@slot item
	@layer components

	Sets item context for Trigger/Content/Indicator.
-->
<script lang="ts">
import { getAccordionContext, setAccordionItemContext } from "./context.js";
import type { AccordionItemProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: AccordionItemProps = $props();
const ctx = getAccordionContext();

setAccordionItemContext({
	get value() {
		return value;
	},
	get disabled() {
		return disabled;
	},
});

const itemAttrs = $derived(ctx.hook.getItem(value));
</script>

<div
	{...rest}
	{...itemAttrs}
	id={ctx.ids.item?.(value)}
	data-kind="accordion"
	data-slot="item"
	class={className}
>
	{@render children?.()}
</div>
