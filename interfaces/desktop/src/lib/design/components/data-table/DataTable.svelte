<!--
	@component Data Table
	@kind data-table
	@layer component
	@category composite
	@description Feature-rich table with sorting, filtering, pagination, and row selection powered by TanStack Table
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/grid/
	@container true
	@containerSlots root
	@compound true
	@blockCategory data
	@defaultStyle data-table-default
	@styleIds data-table-default
	@requiredAxes backgroundColor, border, borderRadius, typography, color
	@slots root:all, header:none, headerCell:none, body:none, row:none, cell:none, footer:none
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
import { useDataTable } from "$lib/design/behaviors/data-table/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { DataTableComponentProps } from "./types.js";

let {
	size = "md",
	variant = "default",
	preset = "default",
	label,
	rowCount,
	colCount,
	children,
	class: className,
	...rest
}: DataTableComponentProps = $props();
const dt = $derived(useDataTable({ label, rowCount, colCount }));
const m = $derived(resolveMacro({ kind: "data-table", preset }));
</script>
<div {...dt.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-slot="root" data-variant={variant} class={cn("w-full overflow-auto", className)} {...rest}>{@render children?.()}</div>
