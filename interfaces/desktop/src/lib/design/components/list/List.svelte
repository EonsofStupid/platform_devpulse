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
-->
<script lang="ts">
import { useList } from "$lib/design/primitives/list/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ListComponentProps } from "./types.js";
let { size = "md", variant = "none", spacing = "default", label, children, class: className, ...rest }: ListComponentProps = $props();
const list = $derived(useList({ label }));
const styleId = "list-default";
</script>
<StyleMacro kind="list" style={styleId}>
	<ul {...list.root} data-kind="list" data-slot="root" data-variant={variant} class={cn("flex flex-col", className)} {...rest}>
		{@render children?.()}
	</ul>
</StyleMacro>
