<!--
	@component Slider.Thumb
	@kind slider
	@slot thumb
	@layer components

	Draggable thumb. ARIA role="slider" from hook via context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";

let { class: className, ...rest }: { class?: string; [key: string]: unknown } = $props();
const ctx = getSliderContext();
</script>

<div
	{...ctx.hook.thumb}
	data-kind="slider"
	data-slot="thumb"
	class={cn(
		"block size-5 rounded-full border-2 shadow-sm",
		"cursor-grab active:cursor-grabbing",
		"focus-visible:outline-2 focus-visible:outline-offset-2",
		className)}
	style:left="{ctx.hook.percent}%"
	{...rest}
></div>
