<!--
	@component Slider.Range
	@kind slider
	@slot range
	@layer components

	Fill bar showing current value position.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getSliderContext } from "./context.js";
import type { SliderRangeProps } from "./types.js";

let { class: className, ...rest }: SliderRangeProps = $props();
const ctx = getSliderContext();
</script>

<div
	data-kind="slider"
	data-slot="range"
	{...rest}
	class={cn("absolute h-full rounded-full", className)}
	style:width="{ctx.hook.percent}%"
></div>
