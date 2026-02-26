<!--
	@component Breadcrumb
	@kind breadcrumb
	@layer components

	ColdLight Breadcrumb -- wraps structureless BreadcrumbRoot with:
	- ARIA attributes (aria-label="Breadcrumb" via builder)
	- Builder provides root + list + item + separator + link slots
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Breadcrumb Pattern
-->
<script lang="ts">
	import type { BreadcrumbComponentProps } from "./types.js";
	import { createBreadcrumb } from "$lib/design/builders/breadcrumb/index.js";
	import BreadcrumbRoot from "$lib/design/primitives/breadcrumb/Breadcrumb.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { breadcrumbRecipe } from "./recipe.js";

	let {
		label = "Breadcrumb",
		separator = "/",
		size = "md",
		children,
		class: className,
		...rest
	}: BreadcrumbComponentProps = $props();

	const builder = createBreadcrumb({
		label: () => label,
		separator: () => separator,
	});
	const classes = $derived(cn(breadcrumbRecipe({ size }), className));
</script>

<BreadcrumbRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</BreadcrumbRoot>
