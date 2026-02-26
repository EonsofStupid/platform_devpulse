<!--
	@component Spacer
	@kind spacer
	@layer components

	ColdLight Spacer — builder-driven flex spacer.
	Builder provides data attributes + aria-hidden. Component adds recipe classes.
	No children — purely presentational.
-->
<script lang="ts">
	import type { SpacerComponentProps } from "./types.js";
	import { createSpacer } from "$lib/design/builders/spacer/index.js";
	import SpacerRoot from "$lib/design/primitives/spacer/Spacer.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { spacerRecipe } from "./recipe.js";

	let {
		size = "auto",
		class: className,
		...rest
	}: SpacerComponentProps = $props();

	const builder = createSpacer();
	const classes = $derived(cn(spacerRecipe({ size }), className));
</script>

<SpacerRoot
	{...builder.root}
	{...rest}
	class={classes}
/>
