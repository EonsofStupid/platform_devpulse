<!--
	@component TabsContent
	@description Structural content panel for a tab.
	Contract: kind="tabs", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getTabsContext } from "./context.js";
import type { TabsContentProps } from "./types.js";

let { value, children, class: className, ...rest }: TabsContentProps = $props();

const ctx = getTabsContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TabsContent");
</script>

<div
	{...rest}
	data-kind="tabs"
	data-slot="content"
	data-state={ctx.value === value ? "visible" : "hidden"}
	class={cn(className)}
>
	{@render children?.()}
</div>
