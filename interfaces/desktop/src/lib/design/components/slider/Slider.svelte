<!--
	@component Slider
	@kind slider
	@layer components

	ColdLight Slider — compound component root.
	Creates MeltUI slider transport and sets root context.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/slider/
-->
<script lang="ts">
	import type { SliderProps } from "./types.js";
	import { createSliderTransport } from "$lib/design/api/adapters/meltui/_internal/slider/index.js";
	import { setSliderContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { sliderRecipe } from "./recipe.js";

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
		// ColdLight 8-axis props
		preset,
		surface,
		material,
		depth,
		bevel,
		glow,
		frame,
		motion,
		transition,
		encoding,
		radius,
		size,
		// Rest spread
		...rest
	}: SliderProps = $props();

	const transport = createSliderTransport({
		get min() { return min; },
		get max() { return max; },
		get value() { return value; },
		get step() { return step; },
		get orientation() { return orientation; },
		onValueChange: (v: any) => onValueChange?.(v),
	});

	setSliderContext(transport);

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const recipe = sliderRecipe();
</script>

<div
	{...transport.slots.root}
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="slider"
	data-slot="root"
	data-orientation={orientation}
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
