<!--
	@component TextUI
	@kind text
	@layer ui

	Styled ColdLight Text — COMPONENT + RECIPE = visual output.
	Wraps components/text (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/text/.

	Usage:
	  <Text size="lg" weight="bold" />
	  <Text as="p" color="muted" />
	  <Text preset="text-default" surface="glass-void" />
-->
<script lang="ts">
	import type { TextUIProps } from "./types.js";
	import Text from "$lib/design/components/text/Text.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { textRecipe } from "$lib/design/components/text/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		size = "base",
		weight = "normal",
		color = "primary",
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
	}: TextUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "text-default",
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
		cn(textRecipe({ size, weight, color }), visual.segments, visual.radius, className),
	);
</script>

<Text {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Text>
