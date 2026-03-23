<!--
	@component EmptyState
	@kind empty-state
	@layer components

	ColdLight EmptyState — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createEmptyState } from "$lib/design/api/dsadapters/coldlight/_internal/empty-state/index.js";
import EmptyStateRoot from "$lib/design/primitives/empty-state/EmptyState.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { emptyStateRecipe } from "./recipe.js";
import type { EmptyStateProps } from "./types.js";

let {
	size = "md",
	children,
	class: className,
	...rest
}: EmptyStateProps = $props();

const builder = createEmptyState();

const classes = $derived(cn(emptyStateRecipe({ size }), className));
</script>

<EmptyStateRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</EmptyStateRoot>
