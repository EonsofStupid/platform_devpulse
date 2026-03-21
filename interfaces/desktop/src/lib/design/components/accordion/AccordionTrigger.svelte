<!--
	@component Accordion.Trigger
	@kind accordion
	@slot trigger
	@layer components

	The clickable button that toggles an item.
	ARIA attrs (aria-expanded, aria-controls, keyboard) come from the hook.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
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
	class={cn(ctx.classes.trigger, className)}
>
	{@render children?.()}
</button>
