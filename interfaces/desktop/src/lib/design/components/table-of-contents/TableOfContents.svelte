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
import { createTableOfContents } from "$lib/design/api/dsadapters/coldlight/_internal/table-of-contents/index.js";
import TableOfContentsRoot from "$lib/design/primitives/table-of-contents/TableOfContents.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { tableOfContentsRecipe } from "./recipe.js";
import type { TableOfContentsComponentProps } from "./types.js";

let {
	// Kind-specific props
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
	onActiveIdChange: (v: string | undefined) => onActiveIdChange?.(v),
});

// Resolve ColdLight visual
// Compose: structural recipe + ColdLight visual + user classes
const classes = $derived(
	cn(tableOfContentsRecipe({ size }), className));
</script>

<TableOfContentsRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</TableOfContentsRoot>
