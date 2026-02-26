<!--
	@component Sticky
	@kind sticky
	@layer components

	ColdLight Sticky — builder-driven position-sticky wrapper.
	Builder provides data attributes. Component adds recipe classes (top offset, z-index).
-->
<script lang="ts">
	import type { StickyComponentProps } from "./types.js";
	import { createSticky } from "$lib/design/builders/sticky/index.js";
	import StickyRoot from "$lib/design/primitives/sticky/Sticky.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { stickyRecipe } from "./recipe.js";

	let {
		top = "0",
		offset = "none",
		children,
		class: className,
		...rest
	}: StickyComponentProps = $props();

	const builder = createSticky();
	const classes = $derived(cn(stickyRecipe({ top, offset }), className));
</script>

<StickyRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</StickyRoot>
