<!--
	@component HStackUI
	@kind hstack
	@layer ui

	Styled ColdLight HStack — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { HStackUIProps } from "./types.js";
	import HStack from "$lib/design/components/hstack/HStack.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { hstackRecipe } from "$lib/design/components/hstack/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		gap, align, justify,
		children, class: className,
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size,
		...rest
	}: HStackUIProps = $props();

	const visual = useColdLight(() => ({
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size,
	}));

	const classes = $derived(cn(hstackRecipe({ gap, align, justify }), visual.segments, visual.radius, className));
</script>

<HStack {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</HStack>
