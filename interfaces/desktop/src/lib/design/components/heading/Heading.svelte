<!--
	@component Heading
	@kind heading
	@layer components

	ColdLight Heading — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createHeading } from "$lib/design/api/dsadapters/coldlight/_internal/heading/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import HeadingRoot from "$lib/design/primitives/heading/Heading.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { headingRecipe } from "./recipe.js";
import type { HeadingProps } from "./types.js";

let {
	level = 2,
	size = "lg",
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
}: HeadingProps = $props();

const builder = createHeading({
	level: () => level,
});

const visual = useColdLight(() => ({
	preset: preset ?? "heading-default",
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

const classes = $derived(cn(headingRecipe({ size }), visual.segments, visual.radius, className));
</script>

<HeadingRoot {...builder.root} {...rest} {level} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</HeadingRoot>
