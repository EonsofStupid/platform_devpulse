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
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
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
