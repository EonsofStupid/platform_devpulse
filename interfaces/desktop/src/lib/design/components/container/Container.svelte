<!--
	@component Container
	@kind container
	@layer components

	ColdLight Container — layout primitive, 8-axis visual system.
-->
<script lang="ts">
	import type { ContainerProps } from "./types.js";
	import { createContainer } from "$lib/design/api/dsadapters/coldlight/_internal/container/index.js";
	import ContainerRoot from "$lib/design/primitives/container/Container.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { containerRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		size = "xl",
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: ContainerProps = $props();

	const builder = createContainer();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(cn(containerRecipe({ size }), visual.segments, visual.radius, className));
</script>

<ContainerRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</ContainerRoot>
