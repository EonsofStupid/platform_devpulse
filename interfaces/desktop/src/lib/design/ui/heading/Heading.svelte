<!--
	@component HeadingUI
	@kind heading
	@layer ui

	Styled ColdLight Heading — COMPONENT + RECIPE = visual output.
	Wraps components/heading (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/heading/.

	Usage:
	  <Heading level={1} size="2xl" />
	  <Heading level={3} size="md" />
	  <Heading preset="heading-default" surface="glass-void" />
-->
<script lang="ts">
	import type { HeadingUIProps } from "./types.js";
	import Heading from "$lib/design/components/heading/Heading.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { headingRecipe } from "$lib/design/components/heading/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		size = "lg",
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
	}: HeadingUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "heading-default",
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
		}),
	);

	// Compose: recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(headingRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<Heading {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Heading>
