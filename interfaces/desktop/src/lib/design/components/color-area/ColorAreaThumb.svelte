<!--
	@component ColorArea.Thumb
	@kind color-area
	@slot thumb
	@layer components

	Draggable indicator with proper slider ARIA.
	THIS is the focusable element — keyboard events go here.
	Positioned at the current x/y channel selection with real channel values.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getChannelRange, percentToValue, roundToStep } from "./color-utils.js";
import { getColorAreaContext } from "./context.js";
import type { ColorAreaThumbProps } from "./types.js";

let { children, class: className, ...rest }: ColorAreaThumbProps = $props();
const ctx = getColorAreaContext();

const xRange = $derived(getChannelRange(ctx.colorSpace, ctx.xChannel));
const yRange = $derived(getChannelRange(ctx.colorSpace, ctx.yChannel));
const xValue = $derived(roundToStep(percentToValue(ctx.xPercent, xRange), xRange.step));
const yValue = $derived(roundToStep(percentToValue(ctx.yPercent, yRange), yRange.step));
</script>

<div
	use:ctx.thumbAction
	id={ctx.ids.thumb}
	role="slider"
	aria-roledescription="2d slider"
	aria-label="{ctx.xChannel} and {ctx.yChannel}"
	aria-valuetext="{ctx.xChannel}: {xValue}, {ctx.yChannel}: {yValue}"
	aria-disabled={ctx.isDisabled || undefined}
	tabindex={ctx.isDisabled ? -1 : 0}
	data-kind="color-area"
	data-slot="thumb"
	data-dragging={ctx.isDragging || undefined}
	class={cn(ctx.classes.thumb, className)}
	style:left="{ctx.xPercent * 100}%"
	style:bottom="{ctx.yPercent * 100}%"
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
