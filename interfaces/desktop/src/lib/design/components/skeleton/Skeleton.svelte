<!--
	@component Skeleton
	@kind skeleton
	@layer components

	ColdLight Skeleton — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { SkeletonComponentProps } from "./types.js";
	import { createSkeleton } from "$lib/design/api/adapters/coldlight/_internal/skeleton/index.js";
	import SkeletonRoot from "$lib/design/primitives/skeleton/Skeleton.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { skeletonRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		variant = "text",
		loading = true,
		onLoadingChange,
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
	}: SkeletonComponentProps = $props();

	const builder = createSkeleton({
		loading: () => loading,
		onLoadingChange: (v: any) => onLoadingChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "skeleton-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(
		cn(skeletonRecipe({ variant }), visual.segments, visual.radius, className),
	);
</script>

<SkeletonRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
