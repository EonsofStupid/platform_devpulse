<!--
	@component Table
	@kind table
	@layer components

	ColdLight Table — wraps structureless TableRoot with:
	- ARIA attributes (aria-label, role="table")
	- Builder-driven attribute binding
	- SD5 token-driven recipe (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Table Pattern
-->
<script lang="ts">
	import type { TableComponentProps } from "./types.js";
	import { createTable } from "$lib/design/builders/table/index.js";
	import TableRoot from "$lib/design/primitives/table/Table.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { tableRecipe } from "./recipe.js";

	let {
		size = "md",
		variant = "default",
		label,
		children,
		class: className,
		...rest
	}: TableComponentProps = $props();

	const builder = createTable({
		get label() { return label; },
	});

	const classes = $derived(cn(tableRecipe({ size, variant }), className));
</script>

<TableRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</TableRoot>
