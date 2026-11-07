<!--
	@component KbdUI
	@kind kbd
	@layer ui

	Styled ColdLight Kbd — COMPONENT + RECIPE = visual output.
	Wraps components/kbd (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/kbd/.

	Usage:
	  <Kbd>Ctrl+C</Kbd>
	  <Kbd size="lg" surface="glass-deep" />
-->
<script lang="ts">
	import type { KbdUIProps } from "./types.js";
	import Kbd from "$lib/design/components/kbd/Kbd.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { kbdRecipe } from "$lib/design/components/kbd/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Kind-specific props (forwarded)
		size = "md",
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
		// Rest spread
		...rest
	}: KbdUIProps = $props();

	// Resolve ColdLight visual: preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? "kbd-default",
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "sm",
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(kbdRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<Kbd {size} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Kbd>
