<!--
	@component TabsList
	@kind tabs
	@slot list
	@layer components

	Tab trigger list container with role="tablist".
	Spreads adapter list slot attrs (role, aria-orientation).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getTabsContext } from "./context.js";
import type { TabsListProps } from "./types.js";

let { children, class: className, ...rest }: TabsListProps = $props();
const tabs = getTabsContext();
</script>

<div
	{...tabs.list}
	class={cn(listClass, className)}
	data-kind="tabs"
	data-slot="list"
	{...rest}
>
	{@render children?.()}
</div>
