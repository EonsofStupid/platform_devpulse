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
-->
<script lang="ts">
import { useDataTable } from "$lib/design/primitives/data-table/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { DataTableComponentProps } from "./types.js";
let { size = "md", variant = "default", label, rowCount, colCount, children, class: className, ...rest }: DataTableComponentProps = $props();
const dt = $derived(useDataTable({ label, rowCount, colCount }));
const styleId = "data-table-default";
</script>
<StyleMacro kind="data-table" style={styleId}>
	<div {...dt.root} data-kind="data-table" data-slot="root" data-variant={variant} class={cn("w-full overflow-auto", className)} {...rest}>{@render children?.()}</div>
</StyleMacro>
