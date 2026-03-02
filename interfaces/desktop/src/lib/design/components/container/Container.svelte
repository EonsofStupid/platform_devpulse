<!--
	@component Container
	@kind container
	@layer components

	ColdLight Container — builder-driven max-width responsive container.
	Builder provides data attributes. Component adds recipe classes (max-width, centering).
-->
<script lang="ts">
	import type { ContainerComponentProps } from "./types.js";
	import { createContainer } from "$lib/design/api/adapters/coldlight/_internal/container/index.js";
	import ContainerRoot from "$lib/design/primitives/container/Container.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { containerRecipe } from "./recipe.js";

	let {
		size = "xl",
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
		...rest
	}: ContainerComponentProps = $props();

	const builder = createContainer();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(cn(containerRecipe({ size }), visual.segments, visual.radius, className));
</script>

<ContainerRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</ContainerRoot>
