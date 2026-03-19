<!--
	@component ScrollArea
	@kind scroll-area
	@layer components
	ColdLight ScrollArea — builder-driven. Builder owns ARIA. Component adds recipe.
	Compound: root / viewport / scrollbar / thumb slots.
-->
<script lang="ts">
import { createScrollArea } from "$lib/design/api/dsadapters/coldlight/_internal/scroll-area/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import ScrollAreaRoot from "$lib/design/primitives/scroll-area/ScrollArea.svelte";
import { cn } from "$lib/design/utils/cn.js";
import {
	scrollAreaRecipe,
	scrollAreaScrollbarRecipe,
	scrollAreaThumbRecipe,
	scrollAreaViewportRecipe,
} from "./recipe.js";
import type { ScrollAreaComponentProps } from "./types.js";

let {
	size = "md",
	orientation = "vertical",
	label,
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
}: ScrollAreaComponentProps = $props();

const builder = createScrollArea({
	get label() {
		return label;
	},
	get orientation() {
		return orientation;
	},
});

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

const rootClasses = $derived(
	cn(scrollAreaRecipe({ size }), visual.segments, visual.radius, className),
);
const viewportClasses = $derived(cn(scrollAreaViewportRecipe()));
const scrollbarClasses = $derived(cn(scrollAreaScrollbarRecipe({ size, orientation })));
const thumbClasses = $derived(cn(scrollAreaThumbRecipe()));
</script>

<ScrollAreaRoot {...builder.root} {...rest} class={rootClasses} data-encoding={visual.encoding || undefined}>
	<div {...builder.viewport} class={viewportClasses} data-kind="scroll-area" data-slot="viewport">
		{@render children?.()}
	</div>
	<div {...builder.scrollbar} class={scrollbarClasses} data-kind="scroll-area" data-slot="scrollbar">
		<div {...builder.thumb} class={thumbClasses} data-kind="scroll-area" data-slot="thumb"></div>
	</div>
</ScrollAreaRoot>
