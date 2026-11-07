<!--
	@component SeparatorUI
	@kind separator
	@layer ui

	Styled ColdLight Separator — COMPONENT + RECIPE = visual output.
	Wraps components/separator (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/separator/.

	Usage:
	  <Separator />
	  <Separator variant="dashed" />
	  <Separator orientation="vertical" surface="glass-deep" />
-->
<script lang="ts">
	import type { SeparatorUIProps } from "./types.js";
	import Separator from "$lib/design/components/separator/Separator.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { separatorRecipe } from "$lib/design/components/separator/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		variant = "solid",
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
		size,
		// Component props (forwarded)
		orientation = "horizontal",
		decorative = false,
		class: className,
		...rest
	}: SeparatorUIProps = $props();

	// Resolve ColdLight visual: preset -> individual props -> encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "divider-default",
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "none",
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(separatorRecipe({ orientation, variant }), visual.segments, visual.radius, className),
	);
</script>

<Separator
	{orientation}
	{decorative}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
