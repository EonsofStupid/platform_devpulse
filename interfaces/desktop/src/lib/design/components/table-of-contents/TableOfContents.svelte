<!--
	@component TableOfContents
	@kind table-of-contents
	@layer components

	ColdLight TableOfContents -- wraps structureless TableOfContentsRoot with:
	- ARIA attributes (aria-label via builder)
	- Active heading tracking (builder manages activeId state)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { TableOfContentsComponentProps } from "./types.js";
	import { createTableOfContents } from "$lib/design/api/adapters/coldlight/_internal/table-of-contents/index.js";
	import TableOfContentsRoot from "$lib/design/primitives/table-of-contents/TableOfContents.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { tableOfContentsRecipe } from "./recipe.js";

	let {
		label = "Table of contents",
		activeId,
		onActiveIdChange,
		size = "md",
		children,
		class: className,
		...rest
	}: TableOfContentsComponentProps = $props();

	const builder = createTableOfContents({
		label: () => label,
		activeId: () => activeId,
		onActiveIdChange,
	});
	const classes = $derived(cn(tableOfContentsRecipe({ size }), className));
</script>

<TableOfContentsRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</TableOfContentsRoot>
