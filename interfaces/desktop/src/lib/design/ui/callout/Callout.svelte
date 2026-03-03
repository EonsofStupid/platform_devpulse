<!--
	@component CalloutUI
	@kind callout
	@layer ui

	Styled ColdLight Callout — COMPONENT + RECIPE = visual output.
	Wraps components/callout (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/callout/.

	Usage:
	  <Callout variant="info" />
	  <Callout variant="warning" glow="amber" />
	  <Callout preset="callout-tip" surface="glass-void" />
-->
<script lang="ts">
	import type { CalloutUIProps } from "./types.js";
	import { CALLOUT_VARIANT_PRESETS } from "./types.js";
	import Callout from "$lib/design/components/callout/Callout.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { calloutRecipe } from "$lib/design/components/callout/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only — variant drives preset)
		variant = "info",
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
		children,
		class: className,
		...rest
	}: CalloutUIProps = $props();

	// Resolve ColdLight visual: variant → preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? CALLOUT_VARIANT_PRESETS[variant as keyof typeof CALLOUT_VARIANT_PRESETS],
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
		cn(calloutRecipe({ variant }), visual.segments, visual.radius, className),
	);
</script>

<Callout {...rest} {variant} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Callout>
