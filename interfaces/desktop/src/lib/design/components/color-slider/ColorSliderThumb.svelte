<!--
	@component ColorSlider.Thumb
	@kind color-slider
	@slot thumb
	@layer components

	Focusable slider thumb with full ARIA slider role.
	Keyboard action for arrow/page/home/end navigation.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getColorSliderContext } from "./context.js";
import type { ColorSliderThumbProps } from "./types.js";

let { children, class: className, ...rest }: ColorSliderThumbProps = $props();
const ctx = getColorSliderContext();

const positionStyle = $derived(
	ctx.orientation === "vertical"
		? `bottom: ${ctx.percent * 100}%`
		: `${ctx.dir === "rtl" ? "right" : "left"}: ${ctx.percent * 100}%`);
</script>

<div
	use:ctx.thumbAction
	id={ctx.ids.thumb}
	role="slider"
	aria-label={ctx.channel}
	aria-valuenow={ctx.channelValue}
	aria-valuemin={ctx.channelMin}
	aria-valuemax={ctx.channelMax}
	aria-valuetext="{ctx.channel}: {ctx.channelValue}"
	aria-orientation={ctx.orientation}
	aria-disabled={ctx.isDisabled || undefined}
	tabindex={ctx.isDisabled ? -1 : 0}
	data-kind="color-slider"
	data-slot="thumb"
	data-dragging={ctx.isDragging || undefined}
	class={cn(className)}
	style={positionStyle}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
