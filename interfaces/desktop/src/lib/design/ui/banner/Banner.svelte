<!--
	@component BannerUI
	@kind banner
	@layer ui

	Styled ColdLight Banner — COMPONENT + RECIPE = visual output.
	Wraps components/banner (ARIA) + applies recipe + ColdLight encoding.
	This is the PUBLIC API. Users import from ui/banner/.

	Usage:
	  <Banner intent="info" />
	  <Banner intent="warning" glow="amber" />
	  <Banner preset="banner-error" surface="glass-void" />
-->
<script lang="ts">
	import type { BannerUIProps } from "./types.js";
	import { BANNER_INTENT_PRESETS } from "./types.js";
	import Banner from "$lib/design/components/banner/Banner.svelte";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { bannerRecipe } from "$lib/design/components/banner/recipe.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		// Visual props (ui/ layer only — intent drives preset)
		intent = "info",
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
		// Component props (forwarded)
		visible,
		onVisibleChange,
		children,
		class: className,
		...rest
	}: BannerUIProps = $props();

	// Resolve ColdLight visual: intent → preset → individual props → encoding
	const visual = useColdLight(
		() => ({
			preset: preset ?? BANNER_INTENT_PRESETS[intent as keyof typeof BANNER_INTENT_PRESETS],
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
		cn(bannerRecipe({ intent }), visual.segments, visual.radius, className),
	);
</script>

<Banner {...rest} {intent} {visible} {onVisibleChange} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</Banner>
