<!--
	@component Progress
	@kind progress
	@layer components

	DUMB component. Progressbar with ARIA.
	Recipe provides size classes. Visual treatment via class prop from caller.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { progressTrackRecipe, progressIndicatorRecipe } from "./recipe.js";
import type { ProgressProps } from "./types.js";

let {
	size = "md",
	value = 0,
	max = 100,
	children,
	class: className,
	...rest
}: ProgressProps = $props();

const clampedValue = $derived(value === null ? null : Math.min(Math.max(value ?? 0, 0), max));
const percentage = $derived(clampedValue === null ? undefined : (clampedValue / max) * 100);
const indeterminate = $derived(value === null);

const trackClasses = $derived(cn(progressTrackRecipe({ size }), className));
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
>
	<div
		class={indicatorClasses}
		data-slot="indicator"
		style:width={percentage !== undefined ? `${percentage}%` : undefined}
		data-state={indeterminate ? "indeterminate" : "determinate"}
	></div>
	{@render children?.()}
</div>
