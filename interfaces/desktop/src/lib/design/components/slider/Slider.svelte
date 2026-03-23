<!--
	@component Slider
	@kind slider
	@layer components

	ColdLight Slider — compound component root.
	Creates MeltUI slider transport and sets root context.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
-->
<script lang="ts">
import { createSliderTransport } from "$lib/design/api/dsadapters/meltui/_internal/slider/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setSliderContext } from "./context.js";
import { sliderComposition } from "./composition.js";
import type { SliderProps } from "./types.js";

let {
	min = 0,
	max = 100,
	value,
	step = 1,
	orientation = "horizontal",
	onValueChange,
	disabled = false,
	children,
	class: className,
	size,
	...rest
}: SliderProps = $props();

const transport = createSliderTransport({
	get min() {
		return min;
	},
	get max() {
		return max;
	},
	get value() {
		return value;
	},
	get step() {
		return step;
	},
	get orientation() {
		return orientation;
	},
		onValueChange: (v: any) => onValueChange?.(v),
});

setSliderContext(transport);

const composition = sliderComposition();
</script>

<div
	{...transport.slots.root}
	class={cn(composition.root, className)}
	data-kind="slider"
	data-slot="root"
	data-orientation={orientation}
	{...rest}
>
	{@render children?.()}
</div>
