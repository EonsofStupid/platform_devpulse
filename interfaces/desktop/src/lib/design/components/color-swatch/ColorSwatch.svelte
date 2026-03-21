<!--
	@component ColorSwatch
	@kind color-swatch
	@layer components

	Presentational colored square. Single element, no compound.
	role="img" with accessible color name.
	Checkerboard background for alpha transparency visibility.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ColorSwatchProps } from "./types.js";

let {
	id,
	color,
	colorName,
	size = "md",
	rounding = "default",
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
}: ColorSwatchProps = $props();

const accessibleName = $derived(colorName ?? color);

const recipe = getRecipe("color-swatch.glass.void");
const recipeClasses = $derived(
	// biome-ignore lint/suspicious/noExplicitAny: recipe boundary
	recipe?.classes?.({ size, rounding } as any) ?? {},
);

const visual = useColdLight(() => ({
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
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

<div
	{id}
	{dir}
	role="img"
	aria-roledescription="color swatch"
	aria-label={accessibleName}
	data-kind="color-swatch"
	data-slot="root"
	data-size={size}
	data-rounding={rounding}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	style:background-color={color}
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</div>
