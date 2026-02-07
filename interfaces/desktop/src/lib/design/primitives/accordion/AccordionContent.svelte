<!--
	@component AccordionContent
	@description Structural expandable content panel for accordion item.
	Contract: kind="accordion", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getAccordionItemContext } from "./context.js";
import type { AccordionContentProps } from "./types.js";

let { children, class: className, ...rest }: AccordionContentProps = $props();
const ctx = getAccordionItemContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AccordionContent");
</script>

<div
	{...rest}
	data-kind="accordion"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
