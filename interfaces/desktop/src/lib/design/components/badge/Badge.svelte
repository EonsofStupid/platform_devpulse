<!--
	@component Badge
	@kind badge
	@layer component
	@category content
	@description Compact label for status, counts, or categorical metadata
	@container false
	@compound false
	@blockCategory content
	@defaultStyle badge-neutral
	@styleIds badge-neutral, badge-accent, badge-positive, badge-negative, badge-notice, badge-informative
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
import { useBadge } from "$lib/design/primitives/badge/index.js";
import { StyleMacro } from "$lib/design/style/index.js";
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
	fillStyle = "bold",
	size = "md",
	overflowMode = "wrap",
	decorative = false,
	children,
	class: className,
	...rest
}: BadgeProps = $props();

const badge = $derived(useBadge({ variant, fillStyle, size, decorative }));
const styleId = $derived(`badge-${variant}`);
</script>

<StyleMacro kind="badge" style={styleId}>
	<span
		{...badge.root}
		{...rest}
		class={cn(
			"inline-flex items-center gap-1 rounded-full border font-medium",
			SIZE[size] ?? SIZE.md,
			overflowMode === "truncate" && "truncate",
			className)}
	>
		{@render children?.()}
	</span>
</StyleMacro>
