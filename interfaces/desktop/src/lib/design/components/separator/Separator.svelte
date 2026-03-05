<!--
	@component Separator
	@kind separator
	@layer components

	ColdLight Separator — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { SeparatorProps } from "./types.js";
	import { createSeparator } from "$lib/design/api/dsadapters/coldlight/_internal/separator/index.js";
	import SeparatorRoot from "$lib/design/primitives/separator/Separator.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { separatorRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		orientation = "horizontal",
		decorative = false,
		variant = "solid",
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		class: className,
		...rest
	}: SeparatorProps = $props();

	const builder = createSeparator({
		orientation: () => orientation,
		decorative: () => decorative,
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? "divider-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "none",
		}),
	);

	const classes = $derived(
		cn(separatorRecipe({ orientation, variant }), visual.segments, visual.radius, className),
	);
</script>

<SeparatorRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined} />
