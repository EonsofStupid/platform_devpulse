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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import {
	dataTableAnatomy,
	useDataTable,
} from "$lib/design/behaviors/navigation/data-table/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
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
const m = $derived(renderForge({ kind: "data-table", preset }));
</script>
<div {...dataTableAnatomy.attrs.root} {...dt.root} {...m.dataAttrs} style={cssVarString(m.cssVars)} data-variant={variant} class={cn("w-full overflow-auto", className)} {...rest}>{@render children?.()}</div>
