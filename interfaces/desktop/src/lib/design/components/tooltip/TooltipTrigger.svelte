<!--
	@component Tooltip.Trigger
	@kind tooltip
	@slot trigger
	@layer components

	Element that triggers the tooltip on hover/focus. ARIA from hook.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getTooltipContext } from "./context.js";

let { children, class: className, ...rest }: { children?: import("svelte").Snippet; class?: string; [key: string]: unknown } = $props();
const ctx = getTooltipContext();
</script>

<div
	{...ctx.hook.trigger}
	data-kind="tooltip"
	data-slot="trigger"
	class={cn("inline-flex", className)}
	{...rest}
>
	{@render children?.()}
</div>
