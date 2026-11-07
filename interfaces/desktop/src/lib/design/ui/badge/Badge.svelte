<!--
	@component BadgeUI
	@kind badge
	@layer ui

	Styled ColdLight Badge — COMPONENT + RECIPE = visual output.
	Wraps components/badge (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/badge/.

	Usage:
	  <Badge intent="info" />
	  <Badge intent="success" size="lg" />
	  <Badge preset="badge-ghost" surface="glass-void" />
-->
<script lang="ts">
	import type { BadgeUIProps } from "./types.js";
	import { BADGE_INTENT_PRESETS } from "./types.js";
	import Badge from "$lib/design/components/badge/Badge.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { badgeRecipe } from "$lib/design/components/badge/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only)
		intent = "default",
		size = "md",
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
		// Component props (forwarded)
		children,
		class: className,
		...rest
	}: BadgeUIProps = $props();

	// Resolve ColdLight visual: intent -> preset -> individual props -> encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? BADGE_INTENT_PRESETS[intent as keyof typeof BADGE_INTENT_PRESETS],
			surface,
			material,
			depth,
			bevel,
			glow,
			frame,
			motion,
			transition,
			encoding,
			radius: radius ?? "full",
			size,
		}),
	);

	// Compose: structural recipe + ColdLight visual + user classes
	const classes = $derived(
		cn(badgeRecipe(size), visual.segments, visual.radius, className),
	);
</script>

<Badge {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Badge>
