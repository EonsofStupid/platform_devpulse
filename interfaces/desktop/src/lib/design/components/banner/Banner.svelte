<!--
	@component Banner
	@kind banner
	@layer components

	ColdLight Banner — builder-driven, 8-axis visual system.
	Builder owns ALL ARIA. useColdLight() resolves visual props.
	Intent maps to named preset: info → banner-info.
-->
<script lang="ts">
	import type { BannerComponentProps } from "./types.js";
	import { BANNER_INTENT_PRESETS } from "./types.js";
	import { createBanner } from "$lib/design/api/adapters/coldlight/_internal/banner/index.js";
	import BannerRoot from "$lib/design/primitives/banner/Banner.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { bannerRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		intent = "info",
		visible = true,
		onVisibleChange,
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
	}: BannerComponentProps = $props();

	const builder = createBanner({
		visible: () => visible,
		onVisibleChange: (v: boolean) => onVisibleChange?.(v),
	});

	const visual = useColdLight(
		() => ({
			preset: preset ?? BANNER_INTENT_PRESETS[intent as keyof typeof BANNER_INTENT_PRESETS],
			surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "md", size,
		}),
	);

	const classes = $derived(
		cn(bannerRecipe({ intent }), visual.segments, visual.radius, className),
	);
</script>

<BannerRoot
	{...builder.root}
	{...rest}
	class={classes}
	data-encoding={visual.encoding || undefined}
>
	{@render children?.()}
</BannerRoot>
