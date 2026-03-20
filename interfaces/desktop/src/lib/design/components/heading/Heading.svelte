<!--
	@component Heading
	@kind heading

	ColdLight Heading — semantic <h1>-<h6> with token-backed styling.
	Primitive provides level → element mapping. Component adds visual.
	VPB authors correct heading level based on context.
-->
<script lang="ts">
import { useHeading } from "$lib/design/primitives/heading/index.js";
import HeadingRoot from "$lib/design/primitives/heading/Heading.svelte";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
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

const heading = $derived(useHeading({ level }));

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

<HeadingRoot {...heading.root} {...rest} {level} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</HeadingRoot>
