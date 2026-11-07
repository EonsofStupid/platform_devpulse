<!--
	@component HStack
	@kind hstack
	@layer components

	ColdLight HStack — layout primitive, 8-axis visual system.
-->
<script lang="ts">
import { createHStack } from "$lib/design/api/dsadapters/coldlight/_internal/hstack/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import HStackRoot from "$lib/design/primitives/hstack/HStack.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { hstackRecipe } from "./recipe.js";
import type { HStackProps } from "./types.js";

let {
	gap,
	align,
	justify,
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
	children,
	class: className,
	...rest
}: HStackProps = $props();

const builder = createHStack();

const visual = useColdLight(() => ({
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
}));

const classes = $derived(
	cn(hstackRecipe({ gap, align, justify }), visual.segments, visual.radius, className),
);
</script>

<HStackRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</HStackRoot>
