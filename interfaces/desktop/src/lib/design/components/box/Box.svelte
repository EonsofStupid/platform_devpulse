<!--
	@component Box
	@kind box
	@layer components

	ColdLight Box — builder-driven layout container.
	Builder provides data attributes. Component adds recipe classes (padding, radius).
-->
<script lang="ts">
	import type { BoxComponentProps } from "./types.js";
	import { createBox } from "$lib/design/api/adapters/coldlight/_internal/box/index.js";
	import BoxRoot from "$lib/design/primitives/box/Box.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { boxRecipe } from "./recipe.js";

	let {
		padding = "none",
		radius = "none",
		as = "div",
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
		size,
		...rest
	}: BoxComponentProps = $props();

	const builder = createBox();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, size,
		}),
	);

	const classes = $derived(cn(boxRecipe({ padding, radius }), visual.segments, visual.radius, className));
</script>

<BoxRoot
	{...builder.root}
	{...rest}
	{as}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</BoxRoot>
