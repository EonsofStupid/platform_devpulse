<!--
	@component ColorWheel.Track
	@kind color-wheel
	@slot track
	@layer components

	The circular ring. Pointer action for drag.
	Consumer styles the conic gradient via CSS on this element.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getColorWheelContext } from "./context.js";
import type { ColorWheelTrackProps } from "./types.js";

let { children, class: className, ...rest }: ColorWheelTrackProps = $props();
const ctx = getColorWheelContext();
</script>

<div
	use:ctx.trackAction
	id={ctx.ids.track}
	data-kind="color-wheel"
	data-slot="track"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</div>
