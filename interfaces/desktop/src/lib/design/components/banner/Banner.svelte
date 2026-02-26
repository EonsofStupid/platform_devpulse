<!--
	@component Banner
	@kind banner
	@layer components

	ColdLight Banner — wraps structureless Banner primitive with:
	- ARIA attributes (role="alert", aria-live)
	- State derivation (data-state based on visibility)
	- SD5 token-driven recipe (intent)

	ColdLight OWNS all ARIA. Primitive is structural only.
	Reference: WAI-ARIA APG Alert Pattern
-->
<script lang="ts">
	import type { BannerComponentProps } from "./types.js";
	import { createBanner } from "$lib/design/builders/banner/index.js";
	import BannerRoot from "$lib/design/primitives/banner/Banner.svelte";
	import { cn } from "$lib/design/primitives/types.js";
	import { bannerRecipe } from "./recipe.js";

	let {
		intent = "info",
		visible = true,
		onVisibleChange,
		children,
		class: className,
		...rest
	}: BannerComponentProps = $props();

	const builder = createBanner({
		visible: () => visible,
		onVisibleChange,
	});

	const classes = $derived(cn(bannerRecipe({ intent }), className));
</script>

<BannerRoot {...builder.root} {...rest} class={classes}>
	{@render children?.()}
</BannerRoot>
