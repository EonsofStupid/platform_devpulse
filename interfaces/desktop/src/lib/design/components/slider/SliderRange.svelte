<!--
	@component SliderRange
	@kind slider
	@layer components

	Slider range — the filled portion of the track.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";
import { sliderComposition } from "./composition.js";
import type { SliderRangeProps } from "./types.js";

let { class: className, ...rest }: SliderRangeProps = $props();

const transport = getSliderContext();
const composition = sliderComposition();
</script>

<div
	{...transport.slots.range}
	class={cn(composition.range, className)}
	data-kind="slider"
	data-slot="range"
	{...rest}
></div>
