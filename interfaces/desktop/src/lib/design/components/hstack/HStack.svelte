<!--
	@component HStack
	@kind hstack
	@layer components

	ColdLight HStack — builder-driven horizontal flex container.
	Builder provides data attributes. Component adds recipe classes (gap, align).
-->
<script lang="ts">
	import type { HStackComponentProps } from "./types.js";
	import { createHStack } from "$lib/design/builders/hstack/index.js";
	import HStackRoot from "$lib/design/primitives/hstack/HStack.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { hstackRecipe } from "./recipe.js";

	let {
		gap,
		align,
		children,
		class: className,
		...rest
	}: HStackComponentProps = $props();

	const builder = createHStack();
	const classes = $derived(cn(hstackRecipe({ gap, align }), className));
</script>

<HStackRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</HStackRoot>
