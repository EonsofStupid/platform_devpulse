<!--
	@component Grid
	@kind grid
	@layer components

	ColdLight Grid — builder-driven CSS Grid container.
	Builder provides data attributes. Component adds recipe classes (columns, gap, rows).
-->
<script lang="ts">
	import type { GridComponentProps } from "./types.js";
	import { createGrid } from "$lib/design/api/adapters/coldlight/_internal/grid/index.js";
	import GridRoot from "$lib/design/primitives/grid/Grid.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { gridRecipe } from "./recipe.js";

	let {
		columns,
		gap,
		rows,
		children,
		class: className,
		...rest
	}: GridComponentProps = $props();

	const builder = createGrid();
	const classes = $derived(cn(gridRecipe({ columns, gap, rows }), className));
</script>

<GridRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</GridRoot>
