<!--
	@component Tabs
	@description Root container and context provider for tabs primitive.
	Contract: kind="tabs", slot="root"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setTabsContext } from "./context.js";
import type { TabsProps } from "./types.js";

let { value = $bindable(""), children, class: className, ...rest }: TabsProps = $props();

setTabsContext({
	get value() {
		return value;
	},
});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Tabs");
</script>

<div
	{...rest}
	data-kind="tabs"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
