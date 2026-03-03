<!--
	@component ButtonUI
	@kind button
	@layer ui

	Styled ColdLight Button — COMPONENT + RECIPE = visual output.
	Wraps components/button (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/button/.

	Usage:
	  <Button intent="primary" />
	  <Button intent="primary" glow="teal" />
	  <Button preset="btn-ghost" surface="glass-void" />
	  <Button surface="glass-deep" depth="z2" bevel="subtle" />
-->
<script lang="ts">
	import type { ButtonUIProps } from "./types.js";
	import { BUTTON_INTENT_PRESETS } from "./types.js";
	import Button from "$lib/design/components/button/Button.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { buttonRecipe } from "$lib/design/components/button/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		intent = "primary",
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
	}: ButtonUIProps = $props();

	// Resolve ColdLight visual: intent → preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? BUTTON_INTENT_PRESETS[intent as keyof typeof BUTTON_INTENT_PRESETS],
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
		cn(buttonRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<Button {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Button>
