<!--
	@component Tabs.Content
	@kind tabs
	@slot content
	@layer components

	Tab panel. ARIA from hook.getContent(value). Hidden when inactive.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getTabsContext } from "./context.js";
import type { TabsContentProps } from "./types.js";

let { value, children, class: className, ...rest }: TabsContentProps = $props();
const ctx = getTabsContext();

const contentAttrs = $derived(ctx.hook.getContent(value));
</script>

<div
	{...contentAttrs}
	data-kind="tabs"
	data-slot="content"
	class={cn("mt-2", className)}
	{...rest}
>
	{#if !contentAttrs.hidden}
		{@render children?.()}
	{/if}
</div>
