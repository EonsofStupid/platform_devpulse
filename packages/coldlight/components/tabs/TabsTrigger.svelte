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
	class={cn(
		"inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium",
		"transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
		"disabled:pointer-events-none disabled:opacity-50",
		className)}
	{...rest}
>
	{@render children?.()}
</button>
