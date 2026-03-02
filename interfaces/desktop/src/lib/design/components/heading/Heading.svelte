<!--
	@component Heading
	@kind heading
	@layer components

	ColdLight Heading — builder-driven, 8-axis visual system.
	Builder provides role="heading" + aria-level. useColdLight() resolves visual props.
	Level determines HTML tag (h1-h6), size is decoupled for visual flexibility.
-->
<script lang="ts">
	import type { HeadingComponentProps } from "./types.js";
	import { createHeading } from "$lib/design/api/adapters/coldlight/_internal/heading/index.js";
	import HeadingRoot from "$lib/design/primitives/heading/Heading.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { headingRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		level = 2,
		size = "lg",
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
		// Rest spread
		...rest
	}: HeadingComponentProps = $props();

	const builder = createHeading({ level: () => level });

	const visual = useColdLight(
		() => ({
			preset: preset ?? "heading-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(
		cn(headingRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<HeadingRoot
	{...builder.root}
	{...rest}
	{level}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</HeadingRoot>
