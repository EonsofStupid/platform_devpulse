<!--
	@component DataTable
	@kind data-table
	@layer components

	ColdLight DataTable — wraps structureless DataTableRoot with:
	- ARIA attributes (role="grid", aria-label, aria-rowcount, aria-colcount)
	- Builder-driven attribute binding for grid semantics
	- SD5 token-driven recipe (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Grid Pattern
-->
<script lang="ts">
import { createDataTable } from "$lib/design/api/dsadapters/coldlight/_internal/data-table/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import DataTableRoot from "$lib/design/primitives/data-table/DataTable.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { dataTableRecipe } from "./recipe.js";
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
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	// Rest spread
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
const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

// Compose: structural recipe + ColdLight visual + user classes
const classes = $derived(
	cn(dataTableRecipe({ size, variant }), visual.segments, visual.radius, className),
);
</script>

<DataTableRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</DataTableRoot>
