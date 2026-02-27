<!--
	@component Text
	@kind text
	@layer components

	ColdLight Text — builder-driven typography component.
	Builder provides data attributes. Component adds recipe classes (size, weight, color).
	Supports polymorphic rendering via `as` prop.
-->
<script lang="ts">
	import type { TextComponentProps } from "./types.js";
	import { createText } from "$lib/design/api/adapters/coldlight/_internal/text/index.js";
	import TextRoot from "$lib/design/primitives/text/Text.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { textRecipe } from "./recipe.js";

	let {
		size = "base",
		weight = "normal",
		color = "default",
		as = "span",
		children,
		class: className,
		...rest
	}: TextComponentProps = $props();

	const builder = createText({ as: () => as });
	const classes = $derived(cn(textRecipe({ size, weight, color }), className));
</script>

<TextRoot
	{...builder.root}
	{...rest}
	{as}
	class={classes}
>
	{@render children?.()}
</TextRoot>
