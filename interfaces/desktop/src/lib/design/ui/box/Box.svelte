<!--
	@component BoxUI
	@kind box
	@layer ui

	Styled ColdLight Box — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { BoxUIProps } from "./types.js";
	import Box from "$lib/design/components/box/Box.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { boxRecipe } from "$lib/design/components/box/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		padding = "none", radius = "none",
		children, class: className,
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, size,
		...rest
	}: BoxUIProps = $props();

	const visual = useColdLight(() => ({
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, size,
	}));

	const classes = $derived(cn(boxRecipe({ padding, radius }), visual.segments, visual.radius, className));
</script>

<Box {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Box>
