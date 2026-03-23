<!--
	@component DataTable
	@kind data-table
	@layer components

	ColdLight DataTable — wraps structureless DataTableRoot with:
	- ARIA attributes (role="grid", aria-label, aria-rowcount, aria-colcount)
	- Builder-driven attribute binding for grid semantics
	- SD5 token-driven composition (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Grid Pattern
-->
<script lang="ts">
import { createDataTable } from "$lib/design/api/dsadapters/coldlight/_internal/data-table/index.js";
import DataTableRoot from "$lib/design/primitives/data-table/DataTable.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { dataTableComposition } from "./composition.js";
import type { DataTableComponentProps } from "./types.js";

let {
	// Kind-specific props
	size = "md",
	variant = "default",
	label,
	rowCount,
	colCount,
	children,
	class: className,
	...rest
}: DataTableComponentProps = $props();

const builder = createDataTable({
	get label() {
		return label;
	},
	get rowCount() {
		return rowCount;
	},
	get colCount() {
		return colCount;
	},
});

// Resolve ColdLight visual
// Compose: structural composition + ColdLight visual + user classes
const classes = $derived(
	cn(dataTableComposition({ size, variant }), className));
</script>

<DataTableRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</DataTableRoot>
