<!--
	@component Banner
	@kind banner
	@layer components

	ColdLight Banner — builder-driven ARIA + state. ZERO visual.
	Builder owns ALL ARIA, keyboard, data attributes.
	Visual (recipe, ColdLight encoding) applied by ui/banner/.
-->
<script lang="ts">
	import type { BannerComponentProps } from "./types.js";
	import { createBanner } from "$lib/design/api/adapters/coldlight/_internal/banner/index.js";
	import BannerRoot from "$lib/design/primitives/banner/Banner.svelte";

	let {
		intent = "info",
		visible = true,
		onVisibleChange,
		children,
		class: className,
		...rest
	}: BannerComponentProps = $props();

	// Builder owns ARIA, keyboard, state
	const builder = createBanner({
		visible: () => visible,
		onVisibleChange: (v: boolean) => onVisibleChange?.(v),
	});
</script>

<BannerRoot {...builder.root} {...rest} class={className}>
	{@render children?.()}
</BannerRoot>
