<!--
	@component EmptyState
	@kind empty-state
	@layer components

	ColdLight EmptyState — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createEmptyState } from "$lib/design/api/dsadapters/coldlight/_internal/empty-state/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import EmptyStateRoot from "$lib/design/primitives/empty-state/EmptyState.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { emptyStateRecipe } from "./recipe.js";
import type { EmptyStateProps } from "./types.js";

let {
	size = "md",
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	children,
	class: className,
	...rest
}: EmptyStateProps = $props();

const builder = createEmptyState();

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "md",
}));

const classes = $derived(cn(emptyStateRecipe({ size }), visual.segments, visual.radius, className));
</script>

<EmptyStateRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</EmptyStateRoot>
