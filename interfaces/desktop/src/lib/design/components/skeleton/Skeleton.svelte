<!--
	@component Skeleton
	@kind skeleton
	@layer component
	@category content
	@description Animated placeholder shape indicating content is loading
	@container false
	@compound false
	@blockCategory feedback
	@defaultStyle skeleton-default
	@styleIds skeleton-default
	@requiredAxes backgroundColor, borderRadius, animation
	@slots root:all
-->
<script lang="ts">
import { useSkeleton } from "$lib/design/primitives/skeleton/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { SkeletonProps, SkeletonVariant } from "./types.js";

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
	text: "h-4 w-full rounded",
	circular: "size-10 rounded-full",
	rectangular: "h-24 w-full rounded-md",
};

let {
	loading = true,
	variant = "text",
	class: className,
	...rest
}: SkeletonProps = $props();

const skeleton = $derived(useSkeleton({ loading }));
const styleId = "skeleton-default";
</script>

<StyleMacro kind="skeleton" style={styleId}>
	<div
		{...skeleton.root}
		data-kind="skeleton"
		data-slot="root"
		data-state={loading ? "loading" : "loaded"}
		data-variant={variant}
		class={cn("animate-pulse", VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.text, className)}
		{...rest}
	></div>
</StyleMacro>
