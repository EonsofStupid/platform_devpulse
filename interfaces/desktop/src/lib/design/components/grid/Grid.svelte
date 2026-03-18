<!--
	@component Grid
	@kind grid
	@layer components

	ColdLight Grid — layout primitive, 8-axis visual system.
-->
<script lang="ts">
import { createGrid } from "$lib/design/api/dsadapters/coldlight/_internal/grid/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import GridRoot from "$lib/design/primitives/grid/Grid.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { gridRecipe } from "./recipe.js";
import type { GridProps } from "./types.js";

let {
	columns,
	gap,
	rows,
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
	children,
	class: className,
	...rest
}: GridProps = $props();

const builder = createGrid();

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
	cn(gridRecipe({ columns, gap, rows }), visual.segments, visual.radius, className),
);
</script>

<GridRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</GridRoot>
