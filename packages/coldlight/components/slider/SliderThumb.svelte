<!--
	@component Slider.Thumb
	@kind slider
	@slot thumb
	@layer components

	Draggable thumb. ARIA role="slider" from hook via context.
-->
<script lang="ts">
import { sliderAnatomy } from "#coldlight/behaviors/inputs/slider/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { getSliderContext } from "./context.js";
import type { SliderThumbProps } from "./types.js";

let { class: className, ...rest }: SliderThumbProps = $props();
const ctx = getSliderContext();
</script>

<div
	{...sliderAnatomy.attrs.thumb}
	{...ctx.hook.thumb}
	{...rest}
	class={cn(
		"block size-5 rounded-full border-2 shadow-sm",
		"cursor-grab active:cursor-grabbing",
		"focus-visible:outline-2 focus-visible:outline-offset-2",
		className)}
	style:left="{ctx.hook.percent}%"
></div>
