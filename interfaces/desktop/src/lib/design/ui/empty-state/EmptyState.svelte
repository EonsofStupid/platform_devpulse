<!--
	@component EmptyStateUI
	@kind empty-state
	@layer ui

	Styled ColdLight EmptyState — COMPONENT + RECIPE = visual output.
	Wraps components/empty-state (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/empty-state/.

	Usage:
	  <EmptyState size="md" />
	  <EmptyState size="lg" surface="glass-void" />
	  <EmptyState preset="my-preset" depth="z2" />
-->
<script lang="ts">
	import type { EmptyStateUIProps } from "./types.js";
	import EmptyState from "$lib/design/components/empty-state/EmptyState.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { emptyStateRecipe } from "$lib/design/components/empty-state/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		size = "md",
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
		// Component props (forwarded)
		children,
		class: className,
		...rest
	}: EmptyStateUIProps = $props();

	// Resolve ColdLight visual: props → encoding
	const visual = useColdLight(
		() => ({
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
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(emptyStateRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<EmptyState {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</EmptyState>
