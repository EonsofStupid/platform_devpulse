<!--
	@component TabsTrigger
	@description Structural trigger button for a tab.
	Contract: kind="tabs", slot="trigger"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getTabsContext } from "./context.js";
import type { TabsTriggerProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: TabsTriggerProps = $props();

const ctx = getTabsContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "TabsTrigger");
</script>

<button
	{...rest}
	data-kind="tabs"
	data-slot="trigger"
	data-state={ctx.value === value ? "selected" : undefined}
	class={cn(className)}
	disabled={disabled || undefined}
>
	{@render children?.()}
</button>
