<!--
	@component Accordion.Trigger
	@kind accordion
	@slot trigger
	@layer components

	ARIA attrs from primitive hook via context.
-->
<script lang="ts">
import { getAccordionContext, getAccordionItemContext } from "./context.js";
import type { AccordionTriggerProps } from "./types.js";

let { children, class: className, ...rest }: AccordionTriggerProps = $props();
const ctx = getAccordionContext();
const item = getAccordionItemContext();

const triggerAttrs = $derived(ctx.hook.getTrigger(item.value, item.disabled));
</script>

<button
	{...triggerAttrs}
	id={ctx.ids.trigger?.(item.value) ?? triggerAttrs.id}
	data-kind="accordion"
	data-slot="trigger"
	class={className}
>
	{@render children?.()}
</button>
