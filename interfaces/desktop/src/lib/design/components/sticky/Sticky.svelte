<!--
	@component Sticky
	@kind sticky
	@layer components

	ColdLight Sticky — builder-driven position-sticky wrapper.
	Builder provides data attributes. Component adds recipe classes (top offset, z-index).
-->
<script lang="ts">
import { createSticky } from "$lib/design/api/dsadapters/coldlight/_internal/sticky/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import StickyRoot from "$lib/design/primitives/sticky/Sticky.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { stickyRecipe } from "./recipe.js";
import type { StickyComponentProps } from "./types.js";

let {
	top = "0",
	offset = "none",
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
}: StickyComponentProps = $props();

const builder = createSticky();

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
	cn(stickyRecipe({ top, offset }), visual.segments, visual.radius, className),
);
</script>

<StickyRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</StickyRoot>
