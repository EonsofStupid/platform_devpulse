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
-->
<script lang="ts">
import { useTable } from "/design/primitives/table/use-table.svelte.js";
import { StyleMacro } from "/design/style/index.js";
import { cn } from "/design/utils/cn.js";
import type { TableComponentProps } from "./types.js";
let { size = "md", variant = "default", label, children, class: className, ...rest }: TableComponentProps = ();
const table = useTable({ label });
const styleId = "table-default";
</script>
<StyleMacro kind="table" style={styleId}>
	<div class="w-full overflow-auto" data-kind="table" data-slot="wrapper">
		<table {...table.root} data-kind="table" data-slot="root" data-variant={variant} class={cn("w-full caption-bottom text-sm", className)} {...rest}>
			{@render children?.()}
		</table>
	</div>
</StyleMacro>
