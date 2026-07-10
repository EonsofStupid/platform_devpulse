<!--
	@component Badge
	@kind badge
	@layer component
	@category content
	@description Compact label for status, counts, or categorical metadata
	@container false
	@compound false
	@blockCategory content
	@defaultStyle badge-default
	@styleIds badge-default, badge-stark, badge-glass, badge-flat, badge-matte
	@requiredAxes backgroundColor, color, borderRadius, typography
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
import { badgeAnatomy, useBadge } from "$lib/design/behaviors/display/badge/index.js";
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { BadgeProps, BadgeSize } from "./badge.types.js";

const SIZE: Record<BadgeSize, string> = {
	sm: "px-1.5 py-0.5 text-xs",
	md: "px-2 py-0.5 text-xs",
	lg: "px-2.5 py-1 text-sm",
	xl: "px-3 py-1 text-sm",
};

let {
	variant = "neutral",
	preset = "default",
	fillStyle = "bold",
	size = "md",
	overflowMode = "wrap",
	decorative = false,
	children,
	class: className,
	...rest
}: BadgeProps = $props();

const badge = $derived(useBadge({ variant, fillStyle, size, decorative }));

const m = $derived(renderForge({ kind: "badge", preset }));
</script>

<span
	{...badgeAnatomy.attrs.root}
	{...badge.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn(
		"inline-flex items-center gap-1 rounded-full border font-medium",
		SIZE[size] ?? SIZE.md,
		overflowMode === "truncate" && "truncate",
		className)}
>
	{@render children?.()}
</span>
