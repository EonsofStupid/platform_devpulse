<!--
	@component EmptyState
	@kind empty-state
	@layer components

	ColdLight EmptyState — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { EmptyStateComponentProps } from "./types.js";
	import { createEmptyState } from "$lib/design/api/adapters/coldlight/_internal/empty-state/index.js";
	import EmptyStateRoot from "$lib/design/primitives/empty-state/EmptyState.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { emptyStateRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		size = "md",
		children,
		class: className,
		// ColdLight 8-axis props
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
		// Rest spread
		...rest
	}: EmptyStateComponentProps = $props();

	const builder = createEmptyState();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md", size,
		}),
	);

	const classes = $derived(
		cn(emptyStateRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<EmptyStateRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</EmptyStateRoot>
