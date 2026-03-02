<!--
	@component Card
	@kind card
	@layer components

	ColdLight Card — builder-driven, 8-axis visual system.
	Builder owns ARIA. useColdLight() resolves visual props.
	Variant maps to named preset: default → card-default.

	Usage:
	  <Card variant="default" />
	  <Card variant="elevated" glow="teal" />
	  <Card preset="card-glow" />
	  <Card surface="glass-deep" depth="z2" bevel="subtle" class="p-6" />
-->
<script lang="ts">
	import type { CardComponentProps } from "./types.js";
	import { CARD_VARIANT_PRESETS } from "./types.js";
	import { createCard } from "$lib/design/api/adapters/coldlight/_internal/card/index.js";
	import CardRoot from "$lib/design/primitives/card/Card.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { cardRecipe } from "./recipe.js";

	let {
		label,
		labelledBy,
		size = "md",
		variant = "default",
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
	}: CardComponentProps = $props();

	const builder = createCard({
		label: () => label,
		labelledBy: () => labelledBy,
	});

	const visual = useColdLight(
		() => ({
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
		}),
	);

	const classes = $derived(
		cn(cardRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<CardRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</CardRoot>
