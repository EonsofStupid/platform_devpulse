<!--
	@component LabelUI
	@kind label
	@layer ui

	Styled ColdLight Label — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { LabelUIProps } from "./types.js";
	import Label from "$lib/design/components/label/Label.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { labelRecipe } from "$lib/design/components/label/recipe.js";
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
		children,
		class: className,
		...rest
	}: LabelUIProps = $props();

	const visual = useColdLight(
		() => ({
			preset: preset ?? "label-default",
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

	const classes = $derived(
		cn(labelRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<Label {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Label>
