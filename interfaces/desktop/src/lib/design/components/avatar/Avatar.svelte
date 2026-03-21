<!--
	@component Avatar (Root)
	@kind avatar
	@layer components

	DUMB compound component. Image load state management + fallback display.
	Visual treatment via class prop from caller.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { getAvatarGroupContext } from "$lib/design/components/avatar-group/context.js";
import { setAvatarContext } from "./context.js";
import type { AvatarRootProps, AvatarLoadStatus } from "./types.js";

const groupCtx = getAvatarGroupContext();

let {
	ids: userIds,
	src,
	alt,
	fallback,
	size: sizeProp = 40,
	onStatusChange,
	isOverBackground = false,
	dir = "ltr",
	children,
	class: className,
	...rest
}: AvatarRootProps = $props();

const size = $derived(groupCtx?.size ?? sizeProp);

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

$effect(() => {
	if (src) {
		status = "loading";
		onStatusChange?.({ status: "loading" });
	}
});

setAvatarContext({
	get src() { return src; },
	get alt() { return alt; },
	get fallbackText() { return fallbackText; },
	get status() { return status; },
	get size() { return size; },
	get isOverBackground() { return isOverBackground; },
	get dir() { return dir; },
	get classes() { return {}; },
	get ids() { return resolvedIds; },
	handleLoad,
	handleError,
});

const rootClasses = $derived(cn(
	"inline-flex items-center justify-center overflow-hidden rounded-full",
	"bg-[var(--surface-elevated)] text-text-secondary font-medium text-sm",
	className,
));
</script>

<span
	id={resolvedIds.root}
	{dir}
	role="img"
	aria-label={alt}
	data-kind="avatar"
	data-slot="root"
	data-state={status}
	class={rootClasses}
	style:width="{size}px"
	style:height="{size}px"
	style:margin-left={groupCtx ? "var(--avatar-group-overlap)" : undefined}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{#if src && status !== "error"}
			<img
				id={resolvedIds.image}
				{src}
				{alt}
				class="h-full w-full object-cover"
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
				class="flex h-full w-full items-center justify-center"
				data-kind="avatar"
				data-slot="fallback"
				aria-hidden="true"
			>
				{fallbackText}
			</span>
		{/if}
	{/if}
</span>
