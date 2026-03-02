<!--
	@component Stack
	@kind stack
	@layer components

	ColdLight Stack — builder-driven vertical flex container.
	Builder provides data attributes. Component adds recipe classes (gap, align).
-->
<script lang="ts">
	import type { StackComponentProps } from "./types.js";
	import { createStack } from "$lib/design/api/adapters/coldlight/_internal/stack/index.js";
	import StackRoot from "$lib/design/primitives/stack/Stack.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { stackRecipe } from "./recipe.js";

	let {
		gap,
		align,
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
		size,
		...rest
	}: StackComponentProps = $props();

	const builder = createStack();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(stackRecipe({ gap, align }), visual.segments, visual.radius, className));
</script>

<StackRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</StackRoot>
