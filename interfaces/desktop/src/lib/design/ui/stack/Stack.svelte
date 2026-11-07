<!--
	@component StackUI
	@kind stack
	@layer ui

	Styled ColdLight Stack — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { StackUIProps } from "./types.js";
	import Stack from "$lib/design/components/stack/Stack.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { stackRecipe } from "$lib/design/components/stack/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		gap, align,
		children, class: className,
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size,
		...rest
	}: StackUIProps = $props();

	const visual = useColdLight(() => ({
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius, size,
	}));

	const classes = $derived(cn(stackRecipe({ gap, align }), visual.segments, visual.radius, className));
</script>

<Stack {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Stack>
