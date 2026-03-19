<!--
	@component Table
	@kind table
	@layer components

	ColdLight Table — wraps structureless TableRoot with:
	- ARIA attributes (aria-label, role="table")
	- Builder-driven attribute binding
	- SD5 token-driven recipe (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Table Pattern
-->
<script lang="ts">
import { createTable } from "$lib/design/api/dsadapters/coldlight/_internal/table/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import TableRoot from "$lib/design/primitives/table/Table.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { tableRecipe } from "./recipe.js";
import type { TableComponentProps } from "./types.js";

let {
	size = "md",
	variant = "default",
	label,
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
	...rest
}: TableComponentProps = $props();

const builder = createTable({
	get label() {
		return label;
	},
});

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

const classes = $derived(
	cn(tableRecipe({ size, variant }), visual.segments, visual.radius, className),
);
</script>

<TableRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</TableRoot>
