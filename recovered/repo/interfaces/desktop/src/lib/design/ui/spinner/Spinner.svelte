<!--
	@component SpinnerUI
	@kind spinner
	@layer ui

	Styled ColdLight Spinner — COMPONENT + RECIPE = visual output.
	Wraps components/spinner (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/spinner/.

	Usage:
	  <Spinner size="md" />
	  <Spinner size="lg" glow="teal" />
	  <Spinner preset="spinner-default" surface="glass-void" />
-->
<script lang="ts">
	import type { SpinnerUIProps } from "./types.js";
	import Spinner from "$lib/design/components/spinner/Spinner.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { spinnerRecipe } from "$lib/design/components/spinner/recipe.js";
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
		class: className,
		...rest
	}: SpinnerUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "spinner-default",
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
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(spinnerRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<Spinner {...rest} class={classes} data-encoding={visual.encoding || undefined} />
