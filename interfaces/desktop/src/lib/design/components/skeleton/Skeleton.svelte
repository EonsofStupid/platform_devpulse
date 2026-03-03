<!--
	@component Skeleton
	@kind skeleton
	@layer components

	ColdLight Skeleton — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { SkeletonProps } from "./types.js";
	import { createSkeleton } from "$lib/design/api/adapters/coldlight/_internal/skeleton/index.js";
	import SkeletonRoot from "$lib/design/primitives/skeleton/Skeleton.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { skeletonRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		variant = "text",
		loading = true,
		onLoadingChange,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		class: className,
		...rest
	}: SkeletonProps = $props();

	const builder = createSkeleton({
		loading: () => loading,
		onLoadingChange: (v: any) => onLoadingChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "skeleton-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(
		cn(skeletonRecipe({ variant }), visual.segments, visual.radius, className),
	);
</script>

<SkeletonRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined} />
