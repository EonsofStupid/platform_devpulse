<!--
	@component Slider
	@kind slider
	@layer component
	@category interactive
	@description Draggable track control for selecting a numeric value or range within a defined interval
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/slider/
	@container false
	@compound true
	@blockCategory form
	@defaultStyle slider-default
	@styleIds slider-default
	@requiredAxes backgroundColor, border, borderRadius, color
	@slots root:all, track:none, range:none, thumb:none, label:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useSlider } from "$lib/design/primitives/slider/use-slider.svelte.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setSliderContext } from "./context.js";
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
	intent = "default",
	class: className,
	...rest
}: SliderProps = $props();

const hook = useSlider({
	get min() { return min; },
	get max() { return max; },
	get value() { return value; },
	get step() { return step; },
	get disabled() { return disabled; },
	onValueChange: (v) => onValueChange?.(v),
});

const styleId = $derived(`slider-${intent}`);

setSliderContext({
	get hook() { return hook; },
});
</script>

<StyleMacro kind="slider" style={styleId}>
	<div
		{...hook.root}
		data-orientation={orientation}
		class={cn(
			"relative flex w-full touch-none select-none items-center",
			orientation === "vertical" && "flex-col h-full",
			disabled && "opacity-50 pointer-events-none",
			className)}
		{...rest}
	>
		{#if children}
			{@render children()}
		{:else}
			<div
				{...hook.track}
				data-kind="slider"
				data-slot="track"
				class={cn(
					"relative grow overflow-hidden rounded-full",
					orientation === "horizontal" ? "h-2 w-full" : "w-2 h-full")}
			>
				<div
					data-kind="slider"
					data-slot="range"
					class="absolute rounded-full"
					style={orientation === "horizontal"
						? `left: 0; width: ${hook.percent}%; height: 100%`
						: `bottom: 0; height: ${hook.percent}%; width: 100%`}
				></div>
			</div>
			<div
				{...hook.thumb}
				data-kind="slider"
				data-slot="thumb"
				class="block size-5 rounded-full border-2 shadow-sm cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2"
				style={orientation === "horizontal"
					? `left: ${hook.percent}%`
					: `bottom: ${hook.percent}%`}
			></div>
		{/if}
	</div>
</StyleMacro>
