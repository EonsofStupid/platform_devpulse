<!--
	@component Callout
	@kind callout
	@layer components

	ColdLight Callout — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
	Variant maps to named preset: info → callout-info.
-->
<script lang="ts">
	import type { CalloutComponentProps } from "./types.js";
	import { CALLOUT_VARIANT_PRESETS } from "./types.js";
	import { createCallout } from "$lib/design/api/adapters/coldlight/_internal/callout/index.js";
	import CalloutRoot from "$lib/design/primitives/callout/Callout.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { calloutRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		variant = "info",
		children,
		class: className,
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
		// Rest spread
		...rest
	}: CalloutComponentProps = $props();

	const builder = createCallout();

	const visual = useColdLight(
		() => ({
			preset: preset ?? CALLOUT_VARIANT_PRESETS[variant as keyof typeof CALLOUT_VARIANT_PRESETS],
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md", size,
		}),
	);

	const classes = $derived(
		cn(calloutRecipe({ variant }), visual.segments, visual.radius, className),
	);
</script>

<CalloutRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
	data-state={variant}
>
	{@render children?.()}
</CalloutRoot>
