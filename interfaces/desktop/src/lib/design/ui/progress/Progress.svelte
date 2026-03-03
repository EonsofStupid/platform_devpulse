<!--
	@component ProgressUI
	@kind progress
	@layer ui

	Styled ColdLight Progress — COMPONENT + RECIPE = visual output.
	Passes indicatorClass to component for indicator slot styling.
-->
<script lang="ts">
	import type { ProgressUIProps } from "./types.js";
	import Progress from "$lib/design/components/progress/Progress.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { progressTrackRecipe, progressIndicatorRecipe } from "$lib/design/components/progress/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		size = "md",
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
		// Component props (forwarded)
		class: className,
		...rest
	}: ProgressUIProps = $props();

	const visual = useColdLight(
		() => ({
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
			size,
		}),
	);

	const classes = $derived(cn(progressTrackRecipe({ size }), visual.segments, visual.radius, className));
	const indicatorClasses = $derived(cn(progressIndicatorRecipe()));
</script>

<Progress {...rest} indicatorClass={indicatorClasses} class={classes} data-encoding={visual.encoding || undefined} />
