<!--
	@component Callout
	@kind callout
	@layer components

	ColdLight Callout — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createCallout } from "$lib/design/components/callout/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import actual parts to make this component";
import { cn } from "$lib/design/utils/cn.js";
import { calloutRecipe } from "./recipe.js";
import type { CalloutProps } from "./types.js";
import { CALLOUT_VARIANT_PRESETS } from "./types.js";

let {
	variant = "info",
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
	children,
	class: className,
	...rest
}: CalloutProps = $props();

const builder = createCallout();

const visual = useColdLight(() => ({
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
}));

const classes = $derived(cn(calloutRecipe({ variant }), visual.segments, visual.radius, className));
</script>

<CalloutRoot {...builder.root} {...rest} class={classes} data-state={variant} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</CalloutRoot>
