<!--
	@component Stat
	@kind stat
	@layer components

	ColdLight Stat — wraps structureless Stat primitive with:
	- ARIA attributes (role="group", aria-label or aria-labelledby)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { StatComponentProps } from "./types.js";
	import { createStat } from "$lib/design/builders/stat/index.js";
	import StatRoot from "$lib/design/primitives/stat/Stat.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { statRecipe } from "./recipe.js";

	let {
		size = "md",
		children,
		class: className,
		...rest
	}: StatComponentProps = $props();

	const builder = createStat();

	const classes = $derived(cn(statRecipe({ size }), className));
</script>

<StatRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</StatRoot>
