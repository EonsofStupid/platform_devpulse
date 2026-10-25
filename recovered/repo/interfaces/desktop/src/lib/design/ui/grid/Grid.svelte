<!--
	@component GridUI
	@kind grid
	@layer ui

	Styled ColdLight Grid — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { GridUIProps } from "./types.js";
	import Grid from "$lib/design/components/grid/Grid.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { gridRecipe } from "$lib/design/components/grid/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		columns, gap, rows,
		children, class: className,
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size,
		...rest
	}: GridUIProps = $props();

	const visual = useColdLight(() => ({
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size,
	}));

	const classes = $derived(cn(gridRecipe({ columns, gap, rows }), visual.segments, visual.radius, className));
</script>

<Grid {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Grid>
