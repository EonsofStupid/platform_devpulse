<!--
	@component List
	@kind list
	@layer component
	@category composite
	@description Ordered or unordered collection of items with optional selection and keyboard navigation
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/listbox/
	@container true
	@containerSlots root
	@compound true
	@blockCategory data
	@defaultStyle list-default
	@styleIds list-default
	@requiredAxes border, color, typography
	@slots root:all, item:none, itemIcon:none, itemContent:none
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
import { useList } from "$lib/design/behaviors/list/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ListComponentProps } from "./types.js";
let { intent = "default", size = "md", variant = "none", spacing = "default", label, children, class: className, ...rest }: ListComponentProps = $props();
const list = $derived(useList({ label }));
</script>
<StyleMacro kind="list" intent={intent}>
	<ul {...list.root} data-kind="list" data-slot="root" data-variant={variant} class={cn("flex flex-col", className)} {...rest}>
		{@render children?.()}
	</ul>
</StyleMacro>
