<!--
	@component ColorSlider.Track
	@kind color-slider
	@slot track
	@layer components

	Gradient track. Pointer action for drag handling.
	Consumer styles the gradient via CSS background on this element.
-->
<script lang="ts">
import { colorSliderAnatomy } from "#coldlight/behaviors/inputs/color-slider/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { getColorSliderContext } from "./context.js";
import type { ColorSliderTrackProps } from "./types.js";

let { children, class: className, ...rest }: ColorSliderTrackProps = $props();
const ctx = getColorSliderContext();
</script>

<div
	{...colorSliderAnatomy.attrs.track}
	use:ctx.trackAction
	id={ctx.ids.track}
	{...rest}
	data-orientation={ctx.orientation}
	data-dragging={ctx.isDragging || undefined}
	class={cn(className)}
>
	{@render children?.()}
</div>
