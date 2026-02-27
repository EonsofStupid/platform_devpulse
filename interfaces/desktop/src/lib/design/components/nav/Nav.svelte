<!--
	@component Nav
	@kind nav
	@layer components

	ColdLight Nav -- wraps structureless NavRoot with:
	- ARIA attributes (aria-label via builder)
	- SD5 token-driven recipe (orientation x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Landmarks
-->
<script lang="ts">
	import type { NavComponentProps } from "./types.js";
	import { createNav } from "$lib/design/api/adapters/coldlight/_internal/nav/index.js";
	import NavRoot from "$lib/design/primitives/nav/Nav.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { navRecipe } from "./recipe.js";

	let {
		label,
		size = "md",
		orientation = "horizontal",
		children,
		class: className,
		...rest
	}: NavComponentProps = $props();

	const builder = createNav({ label: () => label });
	const classes = $derived(cn(navRecipe({ size, orientation }), className));
</script>

<NavRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</NavRoot>
