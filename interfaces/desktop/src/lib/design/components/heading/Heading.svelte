<!--
	@component Heading
	@kind heading

	ColdLight Heading — DUMB component.
	Primitive provides level-to-element mapping. Recipe provides size classes.
	Visual treatment via class prop from caller.
-->
<script lang="ts">
import { useHeading } from "$lib/design/primitives/heading/index.js";
import HeadingRoot from "$lib/design/primitives/heading/Heading.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { headingRecipe } from "./recipe.js";
import type { HeadingProps } from "./types.js";

let {
	level = 2,
	size = "lg",
	children,
	class: className,
	...rest
}: HeadingProps = $props();

const heading = $derived(useHeading({ level }));

const classes = $derived(cn(headingRecipe({ size }), className));
</script>

<HeadingRoot {...heading.root} {...rest} {level} class={classes}>
	{@render children?.()}
</HeadingRoot>
