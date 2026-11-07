<!--
	@component Tabs.Trigger
	@kind tabs
	@slot trigger
	@layer components

	Individual tab button. ARIA from hook.getTrigger(value).
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getTabsContext } from "./context.js";
import type { TabsTriggerProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: TabsTriggerProps = $props();
const ctx = getTabsContext();

const triggerAttrs = $derived(ctx.hook.getTrigger(value, disabled));
</script>

<button
	{...triggerAttrs}
	data-kind="tabs"
	data-slot="trigger"
	data-selected={triggerAttrs["aria-selected"] || undefined}
	disabled={disabled}
	class={cn(
		"inline-flex items-center justify-center whitespace-nowrap",
		ctx.size === "sm" ? "px-2 py-1" : ctx.size === "lg" ? "px-4 py-2" : "px-3 py-1.5",
		className)}
	{...rest}
>
	{@render children?.()}
</button>
