<!--
	@component ScrollArea
	@kind scroll-area
	@layer components
	ColdLight ScrollArea — builder-driven. Builder owns ARIA. Component adds recipe.
	Compound: root / viewport / scrollbar / thumb slots.
-->
<script lang="ts">
	import type { ScrollAreaComponentProps } from "./types.js";
	import { createScrollArea } from "$lib/design/api/adapters/coldlight/_internal/scroll-area/index.js";
	import ScrollAreaRoot from "$lib/design/primitives/scroll-area/ScrollArea.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import {
		scrollAreaRecipe,
		scrollAreaViewportRecipe,
		scrollAreaScrollbarRecipe,
		scrollAreaThumbRecipe,
	} from "./recipe.js";

	let {
		size = "md",
		orientation = "vertical",
		label,
		children,
		class: className,
		...rest
	}: ScrollAreaComponentProps = $props();

	const builder = createScrollArea({
		get label() { return label; },
		get orientation() { return orientation; },
	});

	const rootClasses = $derived(cn(scrollAreaRecipe({ size }), className));
	const viewportClasses = $derived(cn(scrollAreaViewportRecipe()));
	const scrollbarClasses = $derived(cn(scrollAreaScrollbarRecipe({ size, orientation })));
	const thumbClasses = $derived(cn(scrollAreaThumbRecipe()));
</script>

<ScrollAreaRoot {...builder.root} {...rest} class={rootClasses}>
	<div {...builder.viewport} class={viewportClasses} data-kind="scroll-area" data-slot="viewport">
		{@render children?.()}
	</div>
	<div {...builder.scrollbar} class={scrollbarClasses} data-kind="scroll-area" data-slot="scrollbar">
		<div {...builder.thumb} class={thumbClasses} data-kind="scroll-area" data-slot="thumb"></div>
	</div>
</ScrollAreaRoot>
