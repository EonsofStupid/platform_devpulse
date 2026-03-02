<!--
	@component Separator
	@kind separator
	@layer components

	ColdLight Separator — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { SeparatorComponentProps } from "./types.js";
	import { createSeparator } from "$lib/design/api/adapters/coldlight/_internal/separator/index.js";
	import SeparatorRoot from "$lib/design/primitives/separator/Separator.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { separatorRecipe } from "./recipe.js";

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
	}: SeparatorComponentProps = $props();

	const builder = createSeparator({
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
		cn(separatorRecipe({ orientation, variant }), visual.segments, visual.radius, className),
	);
</script>

<SeparatorRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
/>
