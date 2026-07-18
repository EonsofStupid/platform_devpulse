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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { tableAnatomy } from "$lib/design/behaviors/navigation/table/index.js";
import { useTable } from "$lib/design/behaviors/navigation/table/use-table.svelte.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TableComponentProps } from "./types.js";

let {
	size = "md",
	variant = "default",
	label,
	preset = "default",
	children,
	class: className,
	...rest
}: TableComponentProps = $props();
const table = useTable();
const m = $derived(renderForge({ kind: "table", preset }));
</script>
<div class="w-full overflow-auto" {...m.dataAttrs} style={cssVarString(m.cssVars)} data-slot="wrapper">
		<table {...tableAnatomy.attrs.root} {...table.root} aria-label={label} data-variant={variant} class={cn("w-full caption-bottom text-sm", className)} {...rest}>
			{@render children?.()}
		</table>
	</div>
