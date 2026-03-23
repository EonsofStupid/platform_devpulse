<!--
	@component Table
	@kind table
	@layer components

	ColdLight Table — wraps structureless TableRoot with:
	- ARIA attributes (aria-label, role="table")
	- Builder-driven attribute binding
	- SD5 token-driven composition (variant x size)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Table Pattern
-->
<script lang="ts">
import { createTable } from "$lib/design/api/dsadapters/coldlight/_internal/table/index.js";
import TableRoot from "$lib/design/primitives/table/Table.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { tableComposition } from "./composition.js";
import type { TableComponentProps } from "./types.js";

let {
	size = "md",
	variant = "default",
	label,
	children,
	class: className,
	...rest
}: TableComponentProps = $props();

const builder = createTable({
	get label() {
		return label;
	},
});

const classes = $derived(
	cn(tableComposition({ size, variant }), className));
</script>

<TableRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</TableRoot>
