<!--
	@component Avatar
	@kind avatar
	@layer component
	@category content
	@description Displays a user or entity image with a text or icon fallback when the image is unavailable
	@container false
	@compound true
	@blockCategory content
	@defaultStyle avatar-default
	@styleIds avatar-default, avatar-stark, avatar-glass, avatar-flat, avatar-matte
	@requiredAxes backgroundColor, borderRadius, border
	@slots root:all, image:none, fallback:none
	@defaults {
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { AvatarLoadStatus, AvatarProps } from "./avatar.types.js";

let {
	src,
	alt,
	fallback,
	size = 40,
	preset = "default",
	onStatusChange,
	children,
	class: className,
	...rest
}: AvatarProps = $props();

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

const m = $derived(renderForge({ kind: "avatar", preset }));
</script>

<span
	role="img"
	aria-label={alt}
	{...m.dataAttrs}
	data-slot="root"
	data-state={status}
	style={cssVarString(m.cssVars)}
	class={cn(
		"inline-flex items-center justify-center overflow-hidden rounded-full",
		"font-medium text-sm select-none",
		className)}
	style:width="{size}px"
	style:height="{size}px"
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		{#if src && status !== "error"}
			<img
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
