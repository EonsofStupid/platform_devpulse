<!--
	@component Banner
	@kind banner
	@layer components

	ColdLight Banner — builder-driven, 8-axis visual system.
-->
<script lang="ts">
import { createBanner } from "$lib/design/api/dsadapters/coldlight/_internal/banner/index.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import BannerRoot from "$lib/design/primitives/banner/Banner.svelte";
import { cn } from "$lib/design/utils/cn.js";
import { bannerRecipe } from "./recipe.js";
import type { BannerProps } from "./types.js";
import { BANNER_INTENT_PRESETS } from "./types.js";

let {
	intent = "info",
	visible = true,
	onVisibleChange,
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
}: BannerProps = $props();

const builder = createBanner({
	visible: () => visible,
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from builder
	onVisibleChange: (v: any) => onVisibleChange?.(v),
});

const visual = useColdLight(() => ({
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
}));

const classes = $derived(cn(bannerRecipe({ intent }), visual.segments, visual.radius, className));
</script>

<BannerRoot {...builder.root} {...rest} class={classes} data-encoding={visual.encoding || undefined}>
	{@render children?.()}
</BannerRoot>
