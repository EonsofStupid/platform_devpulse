<!--
	@component Divider
	@kind divider
	@layer components

	ColdLight Divider — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
	Individual ColdLight props override preset values.
-->
<script lang="ts">
	import type { DividerComponentProps } from "./types.js";
	import { createDivider } from "$lib/design/api/adapters/coldlight/_internal/divider/index.js";
	import DividerRoot from "$lib/design/primitives/divider/Divider.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { dividerRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		orientation = "horizontal",
		variant = "solid",
		decorative = false,
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
	}: DividerComponentProps = $props();

	const builder = createDivider({
		get orientation() { return orientation; },
		get decorative() { return decorative; },
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "divider-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "none", size,
		}),
	);

	const classes = $derived(
		cn(dividerRecipe({ orientation, variant }), visual.segments, visual.radius, className),
	);
</script>

<DividerRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
