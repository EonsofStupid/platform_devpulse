<!--
	@component Badge
	@kind badge
	@layer components

	Structural presentational label — status indicator, count, notification.
	No primitive needed. Direct component with token-backed styling.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { BadgeProps } from "./types.js";
import { BADGE_VARIANT_PRESETS } from "./types.js";

let {
	id,
	variant = "neutral",
	fillStyle = "bold",
	size = "md",
	overflowMode = "wrap",
	decorative = false,
	dir = "ltr",
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

const recipe = getRecipe("badge.glass.void");
// biome-ignore lint/suspicious/noExplicitAny: recipe classes accept resolved props
const recipeClasses = recipe?.classes?.({} as any) ?? {};

const visual = useColdLight(() => ({
	preset: preset ?? BADGE_VARIANT_PRESETS[variant as keyof typeof BADGE_VARIANT_PRESETS],
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
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
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
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	{...rest}
>
	{@render children?.()}
</span>
