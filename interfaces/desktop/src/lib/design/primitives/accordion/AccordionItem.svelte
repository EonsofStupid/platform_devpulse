<!--
	@component AccordionItem
	@description Structural item wrapper for accordion. Provides item-level context.
	Contract: kind="accordion", slot="item"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AccordionItemProps } from "./types.js";
	import { getAccordionContext, setAccordionItemContext } from "./context.js";

	let { value: itemValue, disabled = false, children, class: className, ...rest }: AccordionItemProps = $props();
	const ctx = getAccordionContext();
	const open = $derived(ctx.value.includes(itemValue));
	const itemDisabled = $derived(disabled || ctx.disabled);

	setAccordionItemContext({
		get open() { return open; },
		get disabled() { return itemDisabled; },
	});

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AccordionItem");
</script>

<div
	{...rest}
	data-kind="accordion"
	data-slot="item"
	data-state={open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
