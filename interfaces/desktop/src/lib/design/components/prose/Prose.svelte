<!--
	@component Prose
	@kind prose
	@layer components

	ColdLight Prose — builder-driven rich text content container.
	Builder provides data attributes. Component adds recipe classes (prose typography).
-->
<script lang="ts">
	import type { ProseComponentProps } from "./types.js";
	import { createProse } from "$lib/design/api/dsadapters/coldlight/_internal/prose/index.js";
	import ProseRoot from "$lib/design/primitives/prose/Prose.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { proseRecipe } from "./recipe.js";

	let {
		size = "base",
		children,
		class: className,
		// ColdLight 8-axis props (size omitted — prose uses ProseSize)
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
	}: ProseComponentProps = $props();

	const builder = createProse();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius,
		}),
	);

	const classes = $derived(cn(proseRecipe({ size }), visual.segments, visual.radius, className));
</script>

<ProseRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</ProseRoot>
