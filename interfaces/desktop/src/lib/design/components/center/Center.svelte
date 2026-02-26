<!--
	@component Center
	@kind center
	@layer components

	ColdLight Center — builder-driven centering container.
	Builder provides data attributes. Component adds recipe classes (flex centering).
-->
<script lang="ts">
	import type { CenterComponentProps } from "./types.js";
	import { createCenter } from "$lib/design/builders/center/index.js";
	import CenterRoot from "$lib/design/primitives/center/Center.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { centerRecipe } from "./recipe.js";

	let {
		inline = false,
		children,
		class: className,
		...rest
	}: CenterComponentProps = $props();

	const builder = createCenter();
	const classes = $derived(cn(centerRecipe({ inline }), className));
</script>

<CenterRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</CenterRoot>
