<!--
	@component Progress
	@kind progress
	@layer components

	ColdLight Progress — compound, 8-axis visual system.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import { progressIndicatorRecipe, progressTrackRecipe } from "./recipe.js";
import type { ProgressProps } from "./types.js";

let {
	size = "md",
	value = 0,
	max = 100,
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
	children,
	class: className,
	...rest
}: ProgressProps = $props();

const clampedValue = $derived(value === null ? null : Math.min(Math.max(value ?? 0, 0), max));
const percentage = $derived(clampedValue === null ? undefined : (clampedValue / max) * 100);
const indeterminate = $derived(value === null);

const visual = useColdLight(() => ({
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
	radius: radius ?? "full",
}));

const trackClasses = $derived(
	cn(progressTrackRecipe({ size }), visual.segments, visual.radius, className),
);
const indicatorClasses = $derived(progressIndicatorRecipe());
</script>

<div
	{...rest}
	class={trackClasses}
	role="progressbar"
	aria-valuenow={clampedValue ?? undefined}
	aria-valuemin={0}
	aria-valuemax={max}
	data-kind="progress"
	data-slot="root"
	data-state={indeterminate ? "indeterminate" : "determinate"}
	data-encoding={visual.encoding || undefined}
>
	<div
		class={indicatorClasses}
		data-slot="indicator"
		style:width={percentage !== undefined ? `${percentage}%` : undefined}
		data-state={indeterminate ? "indeterminate" : "determinate"}
	></div>
	{@render children?.()}
</div>
