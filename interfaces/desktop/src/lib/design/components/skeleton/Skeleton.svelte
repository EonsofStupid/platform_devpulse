<!--
	@component Skeleton
	@kind skeleton
	@layer components

	ColdLight Skeleton — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/skeleton/.

	Usage (from ui/ layer):
	  <Skeleton {loading} {onLoadingChange} class={computedClasses} />
-->
<script lang="ts">
	import type { SkeletonComponentProps } from "./types.js";
	import { createSkeleton } from "$lib/design/api/adapters/coldlight/_internal/skeleton/index.js";
	import SkeletonRoot from "$lib/design/primitives/skeleton/Skeleton.svelte";

	let {
		loading = true,
		onLoadingChange,
		class: className,
		...rest
	}: SkeletonComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createSkeleton({
		loading: () => loading,
		onLoadingChange: (v: any) => onLoadingChange?.(v),
	});
</script>

<SkeletonRoot {...builder.root} {...rest} class={className} />
