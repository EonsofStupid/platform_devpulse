<!--
	@component Accordion
	@kind accordion
	@layer component
	@category composite
	@description Vertically stacked set of expandable sections that reveal or hide associated content
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
	@container true
	@containerSlots content
	@compound true
	@blockCategory layout
	@defaultStyle accordion-default
	@styleIds accordion-default, accordion-stark, accordion-glass, accordion-flat, accordion-matte
	@requiredAxes backgroundColor, border, borderRadius
	@slots root:all, item:none, trigger:none, indicator:none, content:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useAccordion } from "$lib/design/behaviors/accordion/use-accordion.svelte.js";
import { StyleMacro } from "$lib/design/styles/index.js";
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
	intent = "default",
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

<StyleMacro kind="accordion" intent={intent}>
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
