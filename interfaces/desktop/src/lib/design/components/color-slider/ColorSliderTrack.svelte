<!--
	@component ColorSlider.Track
	@kind color-slider
	@slot track
	@layer components

	Gradient track. Pointer action for drag handling.
	Consumer styles the gradient via CSS background on this element.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getColorSliderContext } from "./context.js";
import type { ColorSliderTrackProps } from "./types.js";

let { children, class: className, ...rest }: ColorSliderTrackProps = $props();
const ctx = getColorSliderContext();
</script>

<div
	use:ctx.trackAction
	id={ctx.ids.track}
	data-kind="color-slider"
	data-slot="track"
	data-orientation={ctx.orientation}
	data-dragging={ctx.isDragging || undefined}
	class={cn(ctx.classes.track, className)}
	{...rest}
>
	{@render children?.()}
</div>
