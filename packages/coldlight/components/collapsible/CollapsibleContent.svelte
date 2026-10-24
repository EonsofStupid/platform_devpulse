<!--
	@component Collapsible.Content
	@kind collapsible
	@slot content
	@layer components
-->
<script lang="ts">
import { slide } from "svelte/transition";
import { cn } from "#coldlight/utils/cn.js";
import { getCollapsibleContext } from "./context.js";
import type { CollapsibleContentProps } from "./types.js";

let { children, class: className, ...rest }: CollapsibleContentProps = $props();
const ctx = getCollapsibleContext();
</script>

{#if ctx.isOpen}
	<div
		id={ctx.contentId}
		role="region"
		aria-labelledby={ctx.triggerId}
		data-kind="collapsible"
		data-slot="content"
		data-state="open"
		class={cn(className)}
		transition:slide={{ duration: 200 }}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
