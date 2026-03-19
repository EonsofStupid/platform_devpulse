<!--
	@component SliderThumb
	@kind slider
	@layer components

	Slider thumb — the draggable handle.
	MeltUI transport provides role="slider", aria-valuenow/min/max, tabindex, keyboard handlers.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";
import { sliderRecipe } from "./recipe.js";
import type { SliderThumbProps } from "./types.js";

let { children, class: className, ...rest }: SliderThumbProps = $props();

const transport = getSliderContext();
const recipe = sliderRecipe();
</script>

<span
	{...transport.slots.thumb}
	class={cn(recipe.thumb, className)}
	data-kind="slider"
	data-slot="thumb"
	{...rest}
>
	{@render children?.()}
</span>
