<!--
	@component Kbd
	@kind kbd
	@layer components

	ColdLight Kbd — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createKbd } from "$lib/design/api/dsadapters/coldlight/_internal/kbd/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import KbdRoot from "$lib/design/primitives/kbd/Kbd.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { kbdRecipe } from "./recipe.js";
import type { KbdProps } from "./types.js";

let {
	size = "md",
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
	children,
	class: className,
	...rest
}: KbdProps = $props();

const builder = createKbd();

const visual = useColdLight(() => ({
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
}));

const classes = $derived(cn(kbdRecipe({ size }), visual.segments, visual.radius, className));
</script>

<KbdRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</KbdRoot>
