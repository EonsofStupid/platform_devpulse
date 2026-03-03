<!--
	@component Callout
	@kind callout
	@layer components

	ColdLight Callout — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { CalloutProps } from "./types.js";
	import { CALLOUT_VARIANT_PRESETS } from "./types.js";
	import { createCallout } from "$lib/design/api/adapters/coldlight/_internal/callout/index.js";
	import CalloutRoot from "$lib/design/primitives/callout/Callout.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { calloutRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		variant = "info",
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: CalloutProps = $props();

	const builder = createCallout();

	const visual = useColdLight(
		() => ({
			preset: preset ?? CALLOUT_VARIANT_PRESETS[variant as keyof typeof CALLOUT_VARIANT_PRESETS],
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md",
		}),
	);

	const classes = $derived(
		cn(calloutRecipe({ variant }), visual.segments, visual.radius, className),
	);
</script>

<CalloutRoot {...builder.root} {...rest} class={classes} data-state={variant} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</CalloutRoot>
