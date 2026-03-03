<!--
	@component Text
	@kind text
	@layer components

	ColdLight Text — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { TextProps } from "./types.js";
	import { createText } from "$lib/design/api/adapters/coldlight/_internal/text/index.js";
	import TextRoot from "$lib/design/primitives/text/Text.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { textRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		as = "span",
		size = "base",
		weight = "normal",
		color = "primary",
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: TextProps = $props();

	const builder = createText({
		as: () => as,
	});

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

<TextRoot {...builder.root} {...rest} {as} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</TextRoot>
