<!--
	@component Collapsible.Trigger
	@kind collapsible
	@slot trigger
	@layer components
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getCollapsibleContext } from "./context.js";
import type { CollapsibleTriggerProps } from "./types.js";

let { children, class: className, ...rest }: CollapsibleTriggerProps = $props();
const ctx = getCollapsibleContext();
</script>

<button
	type="button"
	id={ctx.triggerId}
	aria-expanded={ctx.isOpen}
	aria-controls={ctx.contentId}
	aria-disabled={ctx.disabled || undefined}
	disabled={ctx.disabled}
	data-kind="collapsible"
	data-slot="trigger"
	data-state={ctx.isOpen ? "open" : "closed"}
	class={cn(className)}
	onclick={() => ctx.toggle()}
	{...rest}
>
	{@render children?.()}
</button>
