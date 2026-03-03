<!--
	@component Stack
	@kind stack
	@layer components

	ColdLight Stack — layout primitive, 8-axis visual system.
-->
<script lang="ts">
	import type { StackProps } from "./types.js";
	import { createStack } from "$lib/design/api/adapters/coldlight/_internal/stack/index.js";
	import StackRoot from "$lib/design/primitives/stack/Stack.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { stackRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		gap,
		align,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius, size,
		children,
		class: className,
		...rest
	}: StackProps = $props();

	const builder = createStack();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(stackRecipe({ gap, align }), visual.segments, visual.radius, className));
</script>

<StackRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</StackRoot>
