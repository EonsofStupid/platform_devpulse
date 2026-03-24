<!--
	@component Slider.Range
	@kind slider
	@slot range
	@layer components

	Fill bar showing current value position.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSliderContext } from "./context.js";

let { class: className, ...rest }: { class?: string; [key: string]: unknown } = $props();
const ctx = getSliderContext();
</script>

<div
	data-kind="slider"
	data-slot="range"
	class={cn("absolute h-full rounded-full", className)}
	style:width="{ctx.hook.percent}%"
	{...rest}
></div>
