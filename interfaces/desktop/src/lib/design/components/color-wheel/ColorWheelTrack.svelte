<!--
	@component ColorWheel.Track
	@kind color-wheel
	@slot track
	@layer components

	The circular ring. Pointer action for drag.
	Consumer styles the conic gradient via CSS on this element.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
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
	class={cn(ctx.classes.track, className)}
	{...rest}
>
	{@render children?.()}
</div>
