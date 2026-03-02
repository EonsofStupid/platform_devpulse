<!--
	@component Text
	@kind text
	@layer components

	ColdLight Text — builder-driven, 8-axis visual system.
	Builder provides data attributes. useColdLight() resolves visual props.
	Supports polymorphic rendering via `as` prop.
-->
<script lang="ts">
	import type { TextComponentProps } from "./types.js";
	import { createText } from "$lib/design/api/adapters/coldlight/_internal/text/index.js";
	import TextRoot from "$lib/design/primitives/text/Text.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { textRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		size = "base",
		weight = "normal",
		color = "primary",
		as = "span",
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
	}: TextComponentProps = $props();

	const builder = createText({ as: () => as });

	const visual = useColdLight(
		() => ({
			preset: preset ?? "text-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(
		cn(textRecipe({ size, weight, color }), visual.segments, visual.radius, className),
	);
</script>

<TextRoot
	{...builder.root}
	{...rest}
	{as}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</TextRoot>
