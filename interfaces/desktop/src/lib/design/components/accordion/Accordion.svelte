<!--
	@component Accordion (Root)
	@kind accordion
	@layer components

	Compound disclosure component. Hook (ARIA) + StyleMacro (visual).
	Sub-components: Item, Trigger, Content, Indicator.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
-->
<script lang="ts">
import { useAccordion } from "$lib/design/primitives/accordion/use-accordion.svelte.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setAccordionContext } from "./context.js";
import type { AccordionRootProps, AccordionSize } from "./types.js";

const SIZE: Record<AccordionSize, string> = {
	sm: "text-sm",
	md: "text-sm",
	lg: "text-base",
};

let {
	ids,
	type = "single",
	value: controlledValue,
	defaultValue,
	onValueChange,
	collapsible = false,
	disabled = false,
	dir = "ltr",
	orientation = "vertical",
	size = "md",
	children,
	class: className,
	...rest
}: AccordionRootProps = $props();

const hook = useAccordion({
	type,
	value: controlledValue ?? defaultValue,
	collapsible,
	get disabled() { return disabled; },
	onValueChange: (v) => onValueChange?.({ value: v }),
});

const styleId = "accordion-default";

setAccordionContext({
	get hook() { return hook; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get orientation() { return orientation; },
});
</script>

<StyleMacro kind="accordion" style={styleId}>
	<div
		id={ids?.root}
		{...hook.root}
		{dir}
		data-kind="accordion"
		data-slot="root"
		data-orientation={orientation}
		class={cn(SIZE[size] ?? SIZE.md, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
