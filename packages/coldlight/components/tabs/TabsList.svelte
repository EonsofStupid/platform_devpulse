<!--
	@component Tabs.List
	@kind tabs
	@slot list
	@layer components

	Tab trigger container. role="tablist" from hook.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getTabsContext } from "./context.js";
import type { TabsListProps } from "./types.js";

let { children, class: className, ...rest }: TabsListProps = $props();
const ctx = getTabsContext();
</script>

<div
	{...ctx.hook.list}
	data-kind="tabs"
	data-slot="list"
	class={cn("inline-flex items-center", className)}
	{...rest}
>
	{@render children?.()}
</div>
