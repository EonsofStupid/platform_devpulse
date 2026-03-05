<!--
	@component AspectRatio
	@kind aspect-ratio
	@layer components

	ColdLight AspectRatio — builder-driven fixed ratio container.
	Builder provides data attributes + style with aspect-ratio CSS.
	Component resolves preset to numeric ratio and adds recipe classes.
-->
<script lang="ts">
	import type { AspectRatioComponentProps } from "./types.js";
	import { createAspectRatio } from "$lib/design/api/dsadapters/coldlight/_internal/aspect-ratio/index.js";
	import AspectRatioRoot from "$lib/design/primitives/aspect-ratio/AspectRatio.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { aspectRatioRecipe } from "./recipe.js";

	const presetRatios = {
		square: 1,
		video: 16 / 9,
		portrait: 3 / 4,
		wide: 21 / 9,
		ultrawide: 32 / 9,
	} as const;

	let {
		ratio,
		preset = "video",
		children,
		class: className,
		// ColdLight 8-axis props (preset omitted — used for aspect ratio)
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
	}: AspectRatioComponentProps = $props();

	const resolvedRatio = $derived(ratio ?? presetRatios[preset]);
	const builder = createAspectRatio({ ratio: () => resolvedRatio });

	const visual = useColdLight(
		() => ({
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius, size,
		}),
	);

	const classes = $derived(cn(aspectRatioRecipe(), visual.segments, visual.radius, className));
</script>

<AspectRatioRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</AspectRatioRoot>
