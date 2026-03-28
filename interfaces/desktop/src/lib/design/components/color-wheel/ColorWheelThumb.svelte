<!--
	@component ColorWheel.Thumb
	@kind color-wheel
	@slot thumb
	@layer components

	Focusable thumb positioned on the ring at the current hue angle.
	role="slider" with aria-valuenow (0-360).
	Keyboard action for arrow/page/home/end.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getColorWheelContext } from "./context.js";
import type { ColorWheelThumbProps } from "./types.js";

let { children, class: className, ...rest }: ColorWheelThumbProps = $props();
const ctx = getColorWheelContext();

// Position thumb on the ring circumference
const ringRadius = $derived(ctx.size / 2 - 12); // 12px inset for track width
const angleRad = $derived(ctx.hue * (Math.PI / 180));
const thumbX = $derived(ctx.size / 2 + ringRadius * Math.cos(angleRad));
const thumbY = $derived(ctx.size / 2 - ringRadius * Math.sin(angleRad));
</script>

<div
	use:ctx.thumbAction
	id={ctx.ids.thumb}
	role="slider"
	aria-label="Hue"
	aria-valuenow={Math.round(ctx.hue)}
	aria-valuemin={0}
	aria-valuemax={360}
	aria-valuetext="Hue: {Math.round(ctx.hue)}°"
	aria-disabled={ctx.isDisabled || undefined}
	tabindex={ctx.isDisabled ? -1 : 0}
	data-kind="color-wheel"
	data-slot="thumb"
	data-dragging={ctx.isDragging || undefined}
	class={cn(className)}
	style:left="{thumbX}px"
	style:top="{thumbY}px"
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
