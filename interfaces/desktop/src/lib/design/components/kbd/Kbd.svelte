<!--
	@component Kbd
	@kind kbd
	@layer components

	ColdLight Kbd — builder-driven, 8-axis visual system.
	Builder provides data attributes. useColdLight() resolves visual props.
	Uses semantic <kbd> HTML — no ARIA needed.
-->
<script lang="ts">
	import type { KbdComponentProps } from "./types.js";
	import { createKbd } from "$lib/design/api/adapters/coldlight/_internal/kbd/index.js";
	import KbdRoot from "$lib/design/primitives/kbd/Kbd.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { kbdRecipe } from "./recipe.js";

	let {
		// Kind-specific props
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
	}: KbdComponentProps = $props();

	const builder = createKbd();

	const visual = useColdLight(
		() => ({
			preset: preset ?? "kbd-default",
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "sm", size,
		}),
	);

	const classes = $derived(
		cn(kbdRecipe({ size }), visual.segments, visual.radius, className),
	);
</script>

<KbdRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</KbdRoot>
