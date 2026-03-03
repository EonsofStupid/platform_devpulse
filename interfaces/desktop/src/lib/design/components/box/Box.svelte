<!--
	@component Box
	@kind box
	@layer components

	ColdLight Box — layout primitive, 8-axis visual system.
-->
<script lang="ts">
	import type { BoxProps } from "./types.js";
	import { createBox } from "$lib/design/api/adapters/coldlight/_internal/box/index.js";
	import BoxRoot from "$lib/design/primitives/box/Box.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { boxRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		as = "div",
		padding = "none",
		radius = "none",
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, size,
		children,
		class: className,
		...rest
	}: BoxProps = $props();

	const builder = createBox();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, size,
		}),
	);

	const classes = $derived(cn(boxRecipe({ padding, radius }), visual.segments, visual.radius, className));
</script>

<BoxRoot {...builder.root} {...rest} {as} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</BoxRoot>
