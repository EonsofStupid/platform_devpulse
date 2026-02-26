<!--
	@component EmptyState
	@kind empty-state
	@layer components

	ColdLight EmptyState — wraps structureless EmptyState primitive with:
	- ARIA attributes (role="status", optional aria-label)
	- SD5 token-driven recipe (size)

	ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
	import type { EmptyStateComponentProps } from "./types.js";
	import { createEmptyState } from "$lib/design/builders/empty-state/index.js";
	import EmptyStateRoot from "$lib/design/primitives/empty-state/EmptyState.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { emptyStateRecipe } from "./recipe.js";

	let {
		size = "md",
		children,
		class: className,
		...rest
	}: EmptyStateComponentProps = $props();

	const builder = createEmptyState();

	const classes = $derived(cn(emptyStateRecipe({ size }), className));
</script>

<EmptyStateRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</EmptyStateRoot>
