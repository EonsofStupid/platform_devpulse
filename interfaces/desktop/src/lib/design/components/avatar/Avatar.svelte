<!--
	@component Avatar
	@kind avatar
	@layer components

	ARIA + state only. ZERO visual.
	Compound: root + image + fallback.
	imageClass and fallbackClass injected by ui/ layer.
-->
<script lang="ts">
	import type { AvatarComponentProps } from "./types.js";
	import type { AvatarLoadState } from "./types.js";

	let {
		// Kind-specific props
		src,
		alt,
		fallback = "",
		imageClass,
		fallbackClass,
		class: className,
		// Rest spread
		...rest
	}: AvatarComponentProps = $props();

	let loadState = $state<AvatarLoadState>("loading");

	$effect(() => {
		loadState = src ? "loading" : "error";
	});

	const showImage = $derived(src && loadState === "loaded");
	const showFallback = $derived(!src || loadState !== "loaded");

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
	class={className}
	role="img"
	aria-label={alt}
>
	{#if src}
		<img
			{src}
			alt=""
			data-kind="avatar"
			data-slot="image"
			class={imageClass}
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
			class={fallbackClass}
			aria-hidden="true"
		>
			{fallback}
		</span>
	{/if}
</span>
