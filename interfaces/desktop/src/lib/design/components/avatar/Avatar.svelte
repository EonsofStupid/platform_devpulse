<!--
	@component Avatar
	@kind avatar
	@layer components

	ColdLight Avatar — 8-axis visual system, direct HTML rendering.
	ColdLight OWNS all ARIA. useColdLight() resolves visual props.
	Compound: root + image + fallback.
-->
<script lang="ts">
	import type { AvatarComponentProps } from "./types.js";
	import type { AvatarLoadState } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
	import { avatarRootRecipe, avatarImageRecipe, avatarFallbackRecipe } from "./recipe.js";

	let {
		// Kind-specific props
		src,
		alt,
		fallback = "",
		size = "md",
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
		// Rest spread
		...rest
	}: AvatarComponentProps = $props();

	let loadState = $state<AvatarLoadState>("loading");

	$effect(() => {
		loadState = src ? "loading" : "error";
	});

	const showImage = $derived(src && loadState === "loaded");
	const showFallback = $derived(!src || loadState !== "loaded");

	const visual = useColdLight(
		() => ({
			preset, surface, material, depth, bevel, glow, frame, motion, transition,
			encoding, radius: radius ?? "full", size,
		}),
	);

	const rootClasses = $derived(cn(avatarRootRecipe({ size }), visual.segments, visual.radius, className));
	const imageClasses = $derived(cn(avatarImageRecipe()));
	const fallbackClasses = $derived(cn(avatarFallbackRecipe()));

	function handleLoad() {
		loadState = "loaded";
	}

	function handleError() {
		loadState = "error";
	}
</script>

<span
	{...rest}
	data-kind="avatar"
	data-slot="root"
	data-state={loadState}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	role="img"
	aria-label={alt}
>
	{#if src}
		<img
			{src}
			alt=""
			data-kind="avatar"
			data-slot="image"
			class={imageClasses}
			aria-hidden="true"
			onload={handleLoad}
			onerror={handleError}
			style:display={showImage ? "block" : "none"}
		/>
	{/if}
	{#if showFallback && fallback}
		<span
			data-kind="avatar"
			data-slot="fallback"
			class={fallbackClasses}
			aria-hidden="true"
		>
			{fallback}
		</span>
	{/if}
</span>
