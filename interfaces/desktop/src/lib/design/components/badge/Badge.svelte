<!--
	@component Badge
	@kind badge
	@layer components

	ColdLight Badge — builder-driven, 8-axis visual system.
-->
<script lang="ts">
	import type { BadgeProps } from "./types.js";
	import { BADGE_INTENT_PRESETS } from "./types.js";
	import { createBadge } from "$lib/design/api/dsadapters/coldlight/_internal/badge/index.js";
	import BadgeRoot from "$lib/design/primitives/badge/Badge.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { badgeRecipe } from "./recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		intent = "default",
		size = "md",
		decorative,
		preset,
		surface, material, depth, bevel, glow, frame, motion, transition,
		encoding, radius,
		children,
		class: className,
		...rest
	}: BadgeProps = $props();

	const builder = createBadge({
		decorative: () => decorative,
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? BADGE_INTENT_PRESETS[intent as keyof typeof BADGE_INTENT_PRESETS],
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "full", size,
		}),
	);

	const classes = $derived(
		cn(badgeRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<BadgeRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</BadgeRoot>
