<!--
	@component Accordion (Root)
	@kind accordion

	DUMB compound component. Structure + ARIA + structural size.
	Primitive hook provides ARIA behavior.
	Context distributes hook to sub-components.
	ZERO visual logic. Visual comes from StyleMacro via ui/ wrapper.
-->
<script lang="ts">
import { useAccordion } from "$lib/design/primitives/accordion/use-accordion.svelte.js";
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

setAccordionContext({
	get hook() { return hook; },
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get orientation() { return orientation; },
});
</script>

<div
	id={ids?.root}
	{...hook.root}
	{dir}
	data-orientation={orientation}
	class="{SIZE[size] ?? SIZE.md} {className ?? ''}"
	{...rest}
>
	{@render children?.()}
</div>
