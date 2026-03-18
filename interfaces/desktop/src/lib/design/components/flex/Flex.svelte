<!--
	@component Flex
	@kind flex
	@layer components

	ColdLight Flex — builder-driven flexbox container.
	Builder provides data attributes. Component adds recipe classes (direction, gap, align, justify).
-->
<script lang="ts">
import { createFlex } from "$lib/design/api/dsadapters/coldlight/_internal/flex/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import FlexRoot from "$lib/design/primitives/flex/Flex.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { flexRecipe } from "./recipe.js";
import type { FlexComponentProps } from "./types.js";

let {
	direction = "row",
	wrap = false,
	gap,
	align,
	justify,
	as = "div",
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
	transition: coldTransition,
	encoding,
	radius,
	size,
	...rest
}: FlexComponentProps = $props();

const builder = createFlex();

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition: coldTransition,
	encoding,
	radius,
	size,
}));

const classes = $derived(
	cn(
		flexRecipe({ direction, wrap, gap, align, justify }),
		visual.segments,
		visual.radius,
		className,
	),
);
</script>

<FlexRoot
	{...builder.root}
	{...rest}
	{as}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</FlexRoot>
