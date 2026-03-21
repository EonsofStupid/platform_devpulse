<!--
	@component Badge
	@kind badge
	@layer components

	DUMB component. Structural presentational label.
	Recipe provides variant/size classes. Visual treatment via class prop from caller.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { BadgeProps, BadgeVariant, BadgeSize } from "./types.js";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
	neutral: "bg-[var(--surface-elevated)] text-text-secondary border-border-subtle",
	accent: "bg-[var(--color-teal-500)]/10 text-[var(--color-teal-400)] border-[var(--color-teal-500)]/20",
	informative: "bg-[var(--color-purple-500)]/10 text-[var(--color-purple-400)] border-[var(--color-purple-500)]/20",
	positive: "bg-[var(--color-teal-500)]/10 text-[var(--color-teal-400)] border-[var(--color-teal-500)]/20",
	notice: "bg-[var(--color-purple-500)]/10 text-[var(--color-purple-400)] border-[var(--color-purple-500)]/20",
	negative: "bg-[var(--color-red-500)]/10 text-[var(--color-red-400)] border-[var(--color-red-500)]/20",
};

const SIZE_CLASSES: Record<BadgeSize, string> = {
	sm: "px-1.5 py-0.5 text-xs",
	md: "px-2 py-0.5 text-xs",
	lg: "px-2.5 py-1 text-sm",
	xl: "px-3 py-1 text-sm",
};

let {
	id,
	variant = "neutral",
	fillStyle = "bold",
	size = "md",
	overflowMode = "wrap",
	decorative = false,
	dir = "ltr",
	children,
	class: className,
	...rest
}: BadgeProps = $props();

const classes = $derived(cn(
	"inline-flex items-center gap-1 rounded-full border font-medium",
	VARIANT_CLASSES[variant] ?? VARIANT_CLASSES.neutral,
	SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	overflowMode === "truncate" && "truncate",
	className,
));
</script>

<span
	{id}
	{dir}
	role={decorative ? "presentation" : "status"}
	aria-hidden={decorative ? "true" : undefined}
	data-kind="badge"
	data-slot="root"
	data-variant={variant}
	data-fill={fillStyle}
	data-size={size}
	class={classes}
	{...rest}
>
	{@render children?.()}
</span>
