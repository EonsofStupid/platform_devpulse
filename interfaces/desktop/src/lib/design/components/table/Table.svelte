<!--
	@component Table
	@kind table
	@layer component
	@category composite
	@description Semantic HTML table with styled header, body, and footer for presenting tabular data
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/grid/
	@container true
	@containerSlots root
	@compound true
	@blockCategory data
	@defaultStyle table-default
	@styleIds table-default
	@requiredAxes backgroundColor, border, color, typography
	@slots root:all, header:none, headerCell:none, body:none, row:none, cell:none, footer:none, caption:none
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
import { useTable } from "$lib/design/primitives/table/use-table.svelte.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TableComponentProps } from "./types.js";
let { size = "md", variant = "default", label, intent = "default", children, class: className, ...rest }: TableComponentProps = $props();
const table = useTable();
</script>
<StyleMacro kind="table" intent={intent}>
	<div class="w-full overflow-auto" data-kind="table" data-slot="wrapper">
		<table {...table.root} aria-label={label} data-kind="table" data-slot="root" data-variant={variant} class={cn("w-full caption-bottom text-sm", className)} {...rest}>
			{@render children?.()}
		</table>
	</div>
</StyleMacro>
