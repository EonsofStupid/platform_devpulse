<!--
	@component CardUI
	@kind card
	@layer ui

	Styled ColdLight Card — COMPONENT + RECIPE = visual output.
	Wraps components/card (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/card/.

	Usage:
	  <Card variant="default" />
	  <Card variant="elevated" glow="teal" />
	  <Card preset="card-glow" />
	  <Card surface="glass-deep" depth="z2" bevel="subtle" class="p-6" />
-->
<script lang="ts">
	import type { CardUIProps } from "./types.js";
	import { CARD_VARIANT_PRESETS } from "./types.js";
	import Card from "$lib/design/components/card/Card.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { cardRecipe } from "$lib/design/components/card/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		variant = "default",
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
	}: CardUIProps = $props();

	// Resolve ColdLight visual: variant -> preset -> individual props -> encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? CARD_VARIANT_PRESETS[variant as keyof typeof CARD_VARIANT_PRESETS],
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "lg",
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(cardRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<Card {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Card>
