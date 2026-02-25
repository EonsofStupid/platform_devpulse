<!--
	@component SliderTrack
	@kind slider
	@layer components

	Slider track — the background track the thumb slides along.
-->
<script lang="ts">
	import type { SliderTrackProps } from "./types.js";
	import { getSliderContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { sliderRecipe } from "./recipe.js";

	let { children, class: className, ...rest }: SliderTrackProps = $props();

	const transport = getSliderContext();
	const recipe = sliderRecipe();
</script>

<div
	{...transport.slots.track}
	class={cn(recipe.track, className)}
	data-kind="slider"
	data-slot="track"
	{...rest}
>
	{@render children?.()}
</div>
