<!--
	@component Card
	@kind card
	@layer components

	ColdLight Card — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createCard } from "$lib/design/api/dsadapters/coldlight/_internal/card/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import CardRoot from "$lib/design/primitives/card/Card.svelte";
import { cn } from "$lib/design/primitives/types.js";
import { cardRecipe } from "./recipe.js";
import type { CardProps } from "./types.js";
import { CARD_VARIANT_PRESETS } from "./types.js";

let {
	variant = "default",
	size = "md",
	label,
	labelledBy,
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
}: CardProps = $props();

const builder = createCard({
	label: () => label,
	labelledBy: () => labelledBy,
});

const visual = useColdLight(() => ({
	preset: preset ?? CARD_VARIANT_PRESETS[variant as keyof typeof CARD_VARIANT_PRESETS],
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius: radius ?? "lg",
	size,
}));

const classes = $derived(cn(cardRecipe(size), visual.segments, visual.radius, className));
</script>

<CardRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</CardRoot>
