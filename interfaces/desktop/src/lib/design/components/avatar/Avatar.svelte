<!--
	@component Avatar
	@kind avatar
	@layer components

	ColdLight Avatar — renders HTML directly (no primitive .svelte exists).
	- ARIA attributes (role="img", aria-label)
	- State derivation (data-state: loading | loaded | error)
	- SD5 token-driven recipe (size)
	- Compound: root container + image + fallback

	ColdLight OWNS all ARIA. No primitive wrapper — direct HTML rendering.
	Manages image load state via onload/onerror events.
-->
<script lang="ts">
	import type { AvatarComponentProps } from "./types.js";
	import type { AvatarLoadState } from "./types.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { avatarRootRecipe, avatarImageRecipe, avatarFallbackRecipe } from "./recipe.js";

	let {
		src,
		alt,
		fallback = "",
		size = "md",
		class: className,
		...rest
	}: AvatarComponentProps = $props();

	let loadState = $state<AvatarLoadState>("loading");

	$effect(() => {
		loadState = src ? "loading" : "error";
	});

	const showImage = $derived(src && loadState === "loaded");
	const showFallback = $derived(!src || loadState !== "loaded");

	const rootClasses = $derived(cn(avatarRootRecipe({ size }), className));
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
