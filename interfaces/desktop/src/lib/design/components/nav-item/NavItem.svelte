<!--
	@component NavItem
	@kind nav-item
	@layer components

	ColdLight NavItem -- wraps structureless NavItemRoot with:
	- ARIA attributes (aria-current, aria-disabled via builder)
	- State derivation (data-state, data-active, data-disabled)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Landmarks
-->
<script lang="ts">
	import type { NavItemComponentProps } from "./types.js";
	import { createNavItem } from "$lib/design/builders/nav-item/index.js";
	import NavItemRoot from "$lib/design/primitives/nav-item/NavItem.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { navItemRecipe } from "./recipe.js";

	let {
		active = false,
		disabled = false,
		href,
		size = "md",
		children,
		class: className,
		...rest
	}: NavItemComponentProps = $props();

	const builder = createNavItem({
		active: () => active,
		disabled: () => disabled,
		href: () => href,
	});
	const classes = $derived(cn(navItemRecipe({ size }), className));

	const dataState = $derived(
		disabled ? "disabled" : active ? "active" : "idle",
	);
</script>

<NavItemRoot {...builder.root} {...rest} class={classes} data-state={dataState}>
	{@render children?.()}
</NavItemRoot>
