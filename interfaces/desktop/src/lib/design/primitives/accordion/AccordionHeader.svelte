<!--
	@component AccordionHeader
	@description Structural heading wrapper for accordion trigger.
	Contract: kind="accordion", slot="header"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { AccordionHeaderProps } from "./types.js";

	let { children, class: className, ...rest }: AccordionHeaderProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "AccordionHeader");
</script>

<h3
	{...rest}
	data-kind="accordion"
	data-slot="header"
	class={cn(className)}
>
	{@render children?.()}
</h3>
