<!--
	@component ContainerUI
	@kind container
	@layer ui

	Styled ColdLight Container — COMPONENT + RECIPE = visual output.
-->
<script lang="ts">
	import type { ContainerUIProps } from "./types.js";
	import Container from "$lib/design/components/container/Container.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { containerRecipe } from "$lib/design/components/container/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "xl",
		children, class: className,
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
		...rest
	}: ContainerUIProps = $props();

	const visual = useColdLight(() => ({
		preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
	}));

	const classes = $derived(cn(containerRecipe({ size }), visual.segments, visual.radius, className));
</script>

<Container {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Container>
