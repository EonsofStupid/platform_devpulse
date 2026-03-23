<!--
	@component Avatar
	@kind avatar

	THE PRODUCT. Image with fallback + StyleMacro (visual).
	Size → inline dimension. Load state → image/fallback display.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { AvatarProps, AvatarLoadStatus } from "./avatar.types.js";

let {
	src,
	alt,
	fallback,
	size = 40,
	onStatusChange,
	children,
	class: className,
	...rest
}: AvatarProps = $props();

let status = $state<AvatarLoadStatus>("loading");
const fallbackText = $derived(fallback ?? alt?.charAt(0)?.toUpperCase() ?? "?");
const styleId = "avatar-default";

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
</script>

<StyleMacro kind="avatar" style={styleId}>
	<span
		role="img"
		aria-label={alt}
		data-kind="avatar"
		data-slot="root"
		data-state={status}
		class={cn(
			"inline-flex items-center justify-center overflow-hidden rounded-full",
			"font-medium text-sm select-none",
			className,
		)}
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
</StyleMacro>
