<!--
	@component Kbd
	@kind kbd
	@layer components

	ColdLight Kbd — builder-driven keyboard shortcut indicator.
	Builder provides data attributes. Component adds recipe classes (keycap styling).
	Uses semantic <kbd> HTML — no ARIA needed.
-->
<script lang="ts">
	import type { KbdComponentProps } from "./types.js";
	import { createKbd } from "$lib/design/builders/kbd/index.js";
	import KbdRoot from "$lib/design/primitives/kbd/Kbd.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { kbdRecipe } from "./recipe.js";

	let {
		size = "md",
		children,
		class: className,
		...rest
	}: KbdComponentProps = $props();

	const builder = createKbd();
	const classes = $derived(cn(kbdRecipe({ size }), className));
</script>

<KbdRoot
	{...builder.root}
	{...rest}
	class={classes}
>
	{@render children?.()}
</KbdRoot>
