<!--
	@component Box
	@kind box
	@layer components

	ColdLight Box — builder-driven layout container.
	Builder provides data attributes. Component adds recipe classes (padding, radius).
-->
<script lang="ts">
	import type { BoxComponentProps } from "./types.js";
	import { createBox } from "$lib/design/api/adapters/coldlight/_internal/box/index.js";
	import BoxRoot from "$lib/design/primitives/box/Box.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { boxRecipe } from "./recipe.js";

	let {
		padding = "none",
		radius = "none",
		as = "div",
		children,
		class: className,
		...rest
	}: BoxComponentProps = $props();

	const builder = createBox();
	const classes = $derived(cn(boxRecipe({ padding, radius }), className));
</script>

<BoxRoot
	{...builder.root}
	{...rest}
	{as}
	class={classes}
>
	{@render children?.()}
</BoxRoot>
