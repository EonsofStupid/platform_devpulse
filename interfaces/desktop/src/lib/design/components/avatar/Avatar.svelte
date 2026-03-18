<!--
	@component Avatar
	@kind avatar
	@layer components

	ColdLight Avatar — compound, 8-axis visual system.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import { avatarFallbackRecipe, avatarImageRecipe, avatarRootRecipe } from "./recipe.js";
import type { AvatarLoadState, AvatarProps } from "./types.js";

let {
	size = "md",
	src,
	alt,
	fallback,
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
}: AvatarProps = $props();

let loadState: AvatarLoadState = $state("loading");

function handleLoad() {
	loadState = "loaded";
}
function handleError() {
	loadState = "error";
}

const visual = useColdLight(() => ({
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
	radius: radius ?? "full",
}));

const rootClasses = $derived(
	cn(avatarRootRecipe({ size }), visual.segments, visual.radius, className),
);
const imageClasses = $derived(avatarImageRecipe());
const fallbackClasses = $derived(avatarFallbackRecipe());
</script>

<span
	{...rest}
	class={rootClasses}
	data-kind="avatar"
	data-slot="root"
	data-state={loadState}
	data-encoding={visual.encoding || undefined}
>
	{#if src && loadState !== "error"}
		<img
			{src}
			{alt}
			class={imageClasses}
			data-slot="image"
			onload={handleLoad}
			onerror={handleError}
			style:display={loadState === "loaded" ? undefined : "none"}
		/>
	{/if}
	{#if loadState !== "loaded"}
		<span class={fallbackClasses} data-slot="fallback" aria-hidden="true">
			{fallback ?? alt?.charAt(0)?.toUpperCase() ?? "?"}
		</span>
	{/if}
	{@render children?.()}
</span>
