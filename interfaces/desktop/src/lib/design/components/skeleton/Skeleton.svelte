<!--
	@component Skeleton
	@kind skeleton
	@layer components

	ColdLight Skeleton — wraps structureless Skeleton primitive with:
	- ARIA attributes (role="status", aria-busy, aria-label="Loading")
	- State derivation (data-state: loading/loaded)
	- SD5 token-driven recipe (variant)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { SkeletonComponentProps } from "./types.js";
	import { createSkeleton } from "$lib/design/api/adapters/coldlight/_internal/skeleton/index.js";
	import SkeletonRoot from "$lib/design/primitives/skeleton/Skeleton.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { skeletonRecipe } from "./recipe.js";

	let {
		variant = "text",
		loading = true,
		onLoadingChange,
		class: className,
		...rest
	}: SkeletonComponentProps = $props();

	const builder = createSkeleton({
		loading: () => loading,
		onLoadingChange: (v: any) => onLoadingChange?.(v),
	});

	const classes = $derived(cn(skeletonRecipe({ variant }), className));
</script>

<SkeletonRoot {...builder.root} {...rest} class={classes} />
