<!--
	@component Avatar (Root)
	@kind avatar
	@layer components

	Thumbnail representation of user/entity.
	Manages image load state. Shows fallback on error/loading.
	Compound: Image + Fallback sub-components, or renders default inline.
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setAvatarContext } from "./context.js";
import type { AvatarRootProps, AvatarLoadStatus } from "./types.js";

let {
	ids: userIds,
	src,
	alt,
	fallback,
	size = 40,
	onStatusChange,
	isOverBackground = false,
	dir = "ltr",
	preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
	children,
	class: className,
	...rest
}: AvatarRootProps = $props();

const autoIds = createIds("avatar", ["root", "image", "fallback"] as const);
const resolvedIds = $derived({
	root: userIds?.root ?? autoIds.root,
	image: userIds?.image ?? autoIds.image,
	fallback: userIds?.fallback ?? autoIds.fallback,
});

let status = $state<AvatarLoadStatus>("loading");
const fallbackText = $derived(fallback ?? alt?.charAt(0)?.toUpperCase() ?? "?");

function handleLoad() {
	status = "loaded";
	onStatusChange?.({ status: "loaded" });
}

function handleError() {
	status = "error";
	onStatusChange?.({ status: "error" });
}

// Reset status when src changes
$effect(() => {
	if (src) {
		status = "loading";
		onStatusChange?.({ status: "loading" });
	}
});

const recipe = getRecipe("avatar.glass.void");
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setAvatarContext({
	get src() { return src; },
	get alt() { return alt; },
	get fallbackText() { return fallbackText; },
	get status() { return status; },
	get size() { return size; },
	get isOverBackground() { return isOverBackground; },
	get dir() { return dir; },
	get classes() { return recipeClasses; },
	get ids() { return resolvedIds; },
	handleLoad,
	handleError,
});

const visual = useColdLight(() => ({
	preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding,
	radius: radius ?? "full",
}));

const rootClasses = $derived(
	cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

<span
	id={resolvedIds.root}
	{dir}
	role="img"
	aria-label={alt}
	data-kind="avatar"
	data-slot="root"
	data-state={status}
	data-encoding={visual.encoding || undefined}
	class={rootClasses}
	style:width="{size}px"
	style:height="{size}px"
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<!-- Default inline rendering when no compound sub-components used -->
		{#if src && status !== "error"}
			<img
				id={resolvedIds.image}
				{src}
				{alt}
				class={recipeClasses.image}
				data-kind="avatar"
				data-slot="image"
				onload={handleLoad}
				onerror={handleError}
				style:display={status === "loaded" ? undefined : "none"}
			/>
		{/if}
		{#if status !== "loaded"}
			<span
				id={resolvedIds.fallback}
				class={recipeClasses.fallback}
				data-kind="avatar"
				data-slot="fallback"
				aria-hidden="true"
			>
				{fallbackText}
			</span>
		{/if}
	{/if}
</span>
