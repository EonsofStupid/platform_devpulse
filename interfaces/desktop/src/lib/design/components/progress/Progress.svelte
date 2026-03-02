<!--
	@component Progress
	@kind progress
	@layer components

	ColdLight Progress — 8-axis visual system, direct HTML rendering.
	ColdLight OWNS all ARIA. useColdLight() resolves visual props.
	Compound: track (root) + indicator bar.
-->
<script lang="ts">
	import type { ProgressComponentProps } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { progressTrackRecipe, progressIndicatorRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		value = null,
		max = 100,
		size = "md",
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
		// Rest spread
		...rest
	}: ProgressComponentProps = $props();

	const isIndeterminate = $derived(value === null || value === undefined);
	const clampedValue = $derived(
		isIndeterminate ? 0 : Math.min(Math.max(value as number, 0), max),
	);
	const percentage = $derived(
		isIndeterminate ? 0 : max > 0 ? (clampedValue / max) * 100 : 0,
	);

	const dataState = $derived(
		isIndeterminate
			? "indeterminate"
			: clampedValue >= max
				? "complete"
				: "loading",
	);

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "full", size,
		}),
	);

	const trackClasses = $derived(cn(progressTrackRecipe({ size }), visual.segments, visual.radius, className));
	const indicatorClasses = $derived(cn(progressIndicatorRecipe()));
</script>

<div
	{...rest}
	data-kind="progress"
	data-slot="root"
	data-state={dataState}
	data-encoding={visual.encoding || undefined}
	class={trackClasses}
	role="progressbar"
	aria-valuenow={isIndeterminate ? undefined : clampedValue}
	aria-valuemin={0}
	aria-valuemax={max}
>
	<div
		data-kind="progress"
		data-slot="indicator"
		class={indicatorClasses}
		style:width={isIndeterminate ? "100%" : `${percentage}%`}
		aria-hidden="true"
	></div>
</div>
