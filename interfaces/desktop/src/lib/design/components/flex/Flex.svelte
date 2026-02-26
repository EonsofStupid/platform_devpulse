<!--
	@component Flex
	@kind flex
	@layer components

	ColdLight Flex — builder-driven flexbox container.
	Builder provides data attributes. Component adds recipe classes (direction, gap, align, justify).
-->
<script lang="ts">
	import type { FlexComponentProps } from "./types.js";
	import { createFlex } from "$lib/design/builders/flex/index.js";
	import FlexRoot from "$lib/design/primitives/flex/Flex.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { flexRecipe } from "./recipe.js";

	let {
		direction = "row",
		wrap = false,
		gap,
		align,
		justify,
		as = "div",
		children,
		class: className,
		...rest
	}: FlexComponentProps = $props();

	const builder = createFlex();
	const classes = $derived(cn(flexRecipe({ direction, wrap, gap, align, justify }), className));
</script>

<FlexRoot
	{...builder.root}
	{...rest}
	{as}
	class={classes}
>
	{@render children?.()}
</FlexRoot>
