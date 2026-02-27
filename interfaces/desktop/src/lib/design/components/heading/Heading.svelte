<!--
	@component Heading
	@kind heading
	@layer components

	ColdLight Heading — builder-driven semantic heading.
	Builder provides role="heading" + aria-level. Component adds recipe classes (visual size).
	Level determines HTML tag (h1-h6), size is decoupled for visual flexibility.
-->
<script lang="ts">
	import type { HeadingComponentProps } from "./types.js";
	import { createHeading } from "$lib/design/api/adapters/coldlight/_internal/heading/index.js";
	import HeadingRoot from "$lib/design/primitives/heading/Heading.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { headingRecipe } from "./recipe.js";

	let {
		level = 2,
		size = "lg",
		children,
		class: className,
		...rest
	}: HeadingComponentProps = $props();

	const builder = createHeading({ level: () => level });
	const classes = $derived(cn(headingRecipe({ size }), className));
</script>

<HeadingRoot
	{...builder.root}
	{...rest}
	{level}
	class={classes}
>
	{@render children?.()}
</HeadingRoot>
