<!--
	@component InlineMessage
	@kind inline-message
	@layer components

	ColdLight InlineMessage — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
-->
<script lang="ts">
	import type { InlineMessageComponentProps } from "./types.js";
	import { createInlineMessage } from "$lib/design/api/adapters/coldlight/_internal/inline-message/index.js";
	import InlineMessageRoot from "$lib/design/primitives/inline-message/InlineMessage.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { inlineMessageRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		tone = "info",
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
		// Rest spread
		...rest
	}: InlineMessageComponentProps = $props();

	const builder = createInlineMessage();

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md", size,
		}),
	);

	const classes = $derived(
		cn(inlineMessageRecipe({ tone }), visual.segments, visual.radius, className),
	);
</script>

<InlineMessageRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-state={tone}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</InlineMessageRoot>
