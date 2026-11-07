<!--
	@component InlineMessageUI
	@kind inline-message
	@layer ui

	Styled ColdLight InlineMessage — COMPONENT + RECIPE = visual output.
	Wraps components/inline-message (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/inline-message/.

	Usage:
	  <InlineMessage tone="info">Your changes were saved.</InlineMessage>
	  <InlineMessage tone="error" surface="glass-deep" />
-->
<script lang="ts">
	import type { InlineMessageUIProps } from "./types.js";
	import InlineMessage from "$lib/design/components/inline-message/InlineMessage.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { inlineMessageRecipe } from "$lib/design/components/inline-message/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Kind-specific props (forwarded)
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
	}: InlineMessageUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
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
			radius: radius ?? "md",
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(inlineMessageRecipe({ tone }), visual.segments, visual.radius, className),
	);
</script>

<InlineMessage {tone} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</InlineMessage>
