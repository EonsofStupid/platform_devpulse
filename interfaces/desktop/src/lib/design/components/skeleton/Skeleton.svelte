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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { skeletonAnatomy, useSkeleton } from "$lib/design/behaviors/display/skeleton/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
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
	preset = "default",
	class: className,
	...rest
}: SkeletonProps = $props();

const skeleton = $derived(useSkeleton({ loading }));
const m = $derived(renderForge({ kind: "skeleton", preset }));
</script>

<div
		{...skeletonAnatomy.attrs.root}
		{...skeleton.root}
		{...m.dataAttrs}
		style={cssVarString(m.cssVars)}
		data-state={loading ? "loading" : "loaded"}
		data-variant={variant}
		class={cn("animate-pulse", VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.text, className)}
		{...rest}
	></div>
