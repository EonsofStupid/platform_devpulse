<!--
	@component Badge
	@kind badge

	THE PRODUCT. Hook (ARIA) + StyleMacro (visual).
	Variant → style ID → DTCG tokens.
	Size → structural Tailwind classes.
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
			className,
		)}
	>
		{@render children?.()}
	</span>
</StyleMacro>
