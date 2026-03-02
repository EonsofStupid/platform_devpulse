<!--
	@component HStack
	@kind hstack
	@layer components

	ColdLight HStack — builder-driven horizontal flex container.
	Builder provides data attributes. Component adds recipe classes (gap, align).
-->
<script lang="ts">
	import type { HStackComponentProps } from "./types.js";
	import { createHStack } from "$lib/design/api/adapters/coldlight/_internal/hstack/index.js";
	import HStackRoot from "$lib/design/primitives/hstack/HStack.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { hstackRecipe } from "./recipe.js";

	let {
		gap,
		align,
		justify,
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
	}: HStackComponentProps = $props();

	const builder = createHStack();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(hstackRecipe({ gap, align, justify }), visual.segments, visual.radius, className));
</script>

<HStackRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</HStackRoot>
