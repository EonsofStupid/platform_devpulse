<!--
	@component Skeleton
	@kind skeleton
	@layer components

	ColdLight Skeleton — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createSkeleton } from "$lib/design/api/dsadapters/coldlight/_internal/skeleton/index.js";
import SkeletonRoot from "$lib/design/primitives/skeleton/Skeleton.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { skeletonRecipe } from "./recipe.js";
import type { SkeletonProps } from "./types.js";

let {
	variant = "text",
	loading = true,
	onLoadingChange,
	class: className,
	...rest
}: SkeletonProps = $props();

const builder = createSkeleton({
	loading: () => loading,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onLoadingChange: (v: any) => onLoadingChange?.(v),
});

const classes = $derived(
	cn(skeletonRecipe({ variant }), className));
</script>

<SkeletonRoot {...builder.root} {...rest} class={classes} />
