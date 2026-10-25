<!--
	@component StatUI
	@kind stat
	@layer ui

	Styled ColdLight Stat — COMPONENT + RECIPE = visual output.
	Wraps components/stat (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/stat/.

	Usage:
	  <Stat size="md" />
	  <Stat size="lg" surface="glass-deep" />
	  <Stat preset="stat-default" />
-->
<script lang="ts">
	import type { StatUIProps } from "./types.js";
	import Stat from "$lib/design/components/stat/Stat.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { statRecipe } from "$lib/design/components/stat/recipe.js";
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
	}: StatUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "stat-default",
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
		cn(statRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<Stat {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Stat>
