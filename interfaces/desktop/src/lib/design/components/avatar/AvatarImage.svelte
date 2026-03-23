<!--
	@component Avatar.Image
	@kind avatar
	@slot image
	@layer components

	The avatar image. Tracks load/error state via context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getAvatarContext } from "./context.js";
import type { HTMLAttributes } from "svelte/elements";

let { class: className, ...rest }: Omit<HTMLAttributes<HTMLImageElement>, "style" | "class"> & { class?: string } = $props();
const ctx = getAvatarContext();
</script>

{#if ctx.src && ctx.status !== "error"}
	<img
		id={ctx.ids.image}
		src={ctx.src}
		alt={ctx.alt}
		class={cn(ctx.classes.image, className)}
		data-kind="avatar"
		data-slot="image"
		onload={() => ctx.handleLoad()}
		onerror={() => ctx.handleError()}
		style:display={ctx.status === "loaded" ? undefined : "none"}
		{...rest}
	/>
{/if}
