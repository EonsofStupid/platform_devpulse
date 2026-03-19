<!--
	@component Stack
	@kind stack
	@layer components

	ColdLight Stack — layout primitive, 8-axis visual system.
-->
<script lang="ts">
import { createStack } from "$lib/design/api/dsadapters/coldlight/_internal/stack/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import StackRoot from "$lib/design/primitives/stack/Stack.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { stackRecipe } from "./recipe.js";
import type { StackProps } from "./types.js";

let {
	gap,
	align,
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
}: StackProps = $props();

const builder = createStack();

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
	cn(stackRecipe({ gap, align }), visual.segments, visual.radius, className),
);
</script>

<StackRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</StackRoot>
