<!--
	@component SliderRange
	@kind slider
	@layer components

	Slider range — the filled portion of the track.
-->
<script lang="ts">
	import type { SliderRangeProps } from "./types.js";
	import { getSliderContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { sliderRecipe } from "./recipe.js";

	let { class: className, ...rest }: SliderRangeProps = $props();

	const transport = getSliderContext();
	const recipe = sliderRecipe();
</script>

<div
	{...transport.slots.range}
	class={cn(recipe.range, className)}
	data-kind="slider"
	data-slot="range"
	{...rest}
></div>
