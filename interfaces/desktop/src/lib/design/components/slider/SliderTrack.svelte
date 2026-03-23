<!--
	@component SliderTrack
	@kind slider
	@layer components

	Slider track — the background track the thumb slides along.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";
import { sliderComposition } from "./composition.js";
import type { SliderTrackProps } from "./types.js";

let { children, class: className, ...rest }: SliderTrackProps = $props();

const transport = getSliderContext();
const composition = sliderComposition();
</script>

<div
	{...transport.slots.track}
	class={cn(composition.track, className)}
	data-kind="slider"
	data-slot="track"
	{...rest}
>
	{@render children?.()}
</div>
