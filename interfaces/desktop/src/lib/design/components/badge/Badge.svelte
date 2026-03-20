<!--
	@component Badge
	@kind badge

	ColdLight Badge — presentational (role="presentation").
	S2 pattern: variant × fillStyle drives color. Provider for child Text/Icon.
-->
<script lang="ts">
import { useBadge } from "$lib/design/primitives/badge/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import type { BadgeProps } from "./types.js";
import { BADGE_INTENT_PRESETS } from "./types.js";

const SIZE_CLASSES: Record<string, string> = {
	sm: "h-5 px-1.5 text-xs",
	md: "h-6 px-2 text-xs",
	lg: "h-7 px-2.5 text-sm",
};

let {
	intent = "default",
	size = "md",
	decorative,
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	children,
	class: className,
	...rest
}: BadgeProps = $props();

const badge = $derived(useBadge({
	variant: intent === "error" ? "negative" : intent === "default" ? "neutral" : intent as any,
	size,
	decorative,
}));

const visual = useColdLight(() => ({
	preset: preset ?? BADGE_INTENT_PRESETS[intent as keyof typeof BADGE_INTENT_PRESETS],
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "full",
	size,
}));

const classes = $derived(cn(
	"badge",
	"inline-flex items-center justify-center font-medium whitespace-nowrap",
	SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	visual.segments,
	visual.radius,
	className,
));
</script>

<span {...badge.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</span>
