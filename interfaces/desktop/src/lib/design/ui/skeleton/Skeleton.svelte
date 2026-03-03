<!--
	@component SkeletonUI
	@kind skeleton
	@layer ui

	Styled ColdLight Skeleton — COMPONENT + RECIPE = visual output.
	Wraps components/skeleton (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/skeleton/.

	Usage:
	  <Skeleton variant="text" />
	  <Skeleton variant="circular" />
	  <Skeleton preset="skeleton-default" surface="glass-void" />
-->
<script lang="ts">
	import type { SkeletonUIProps } from "./types.js";
	import Skeleton from "$lib/design/components/skeleton/Skeleton.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { skeletonRecipe } from "$lib/design/components/skeleton/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		variant = "text",
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
		// Component props (forwarded)
		class: className,
		...rest
	}: SkeletonUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "skeleton-default",
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
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(skeletonRecipe({ variant }), visual.segments, visual.radius, className),
	);
</script>

<Skeleton {...rest} class={classes} data-encoding={visual.encoding || undefined} />
