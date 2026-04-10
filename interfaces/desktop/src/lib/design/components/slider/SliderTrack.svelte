<!--
	@component Slider.Track
	@kind slider
	@slot track
	@layer components

	Track rail. ARIA from hook via context.
-->
<script lang="ts">
import { sliderAnatomy } from "$lib/design/behaviors/inputs/slider/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";
import type { SliderTrackProps } from "./types.js";

let { children, class: className, ...rest }: SliderTrackProps = $props();
const ctx = getSliderContext();
</script>

<div
	{...sliderAnatomy.attrs.track}
	{...ctx.hook.track}
	{...rest}
	class={cn("relative h-2 w-full grow overflow-hidden rounded-full", className)}
>
	{@render children?.()}
</div>
