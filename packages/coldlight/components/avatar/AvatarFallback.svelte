<!--
	@component Avatar.Fallback
	@kind avatar
	@slot fallback
	@layer components

	Shown when image is loading or errored.
	Default: first letter of alt text.
-->
<script lang="ts">
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { cn } from "#coldlight/utils/cn.js";
import { getAvatarContext } from "./context.js";

let {
	children,
	class: className,
	...rest
}: Omit<HTMLAttributes<HTMLSpanElement>, "style" | "class" | "children"> & {
	class?: string;
	children?: Snippet;
} = $props();
const ctx = getAvatarContext();
</script>

{#if ctx.status !== "loaded"}
	<span
		id={ctx.ids.fallback}
		class={cn(className)}
		data-kind="avatar"
		data-slot="fallback"
		aria-hidden="true"
		{...rest}
	>
		{#if children}
			{@render children()}
		{:else}
			{ctx.fallbackText}
		{/if}
	</span>
{/if}
