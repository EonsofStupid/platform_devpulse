<!--
	@component TooltipTrigger
	@kind tooltip
	@layer components

	Tooltip trigger element — the hover/focus target.
	Renders as <span> wrapper so it can wrap any element.
	MeltUI slot attrs contain hover/focus event handlers.

	ARIA attributes are provided by the MeltUI transport (aria-describedby, etc).
-->
<script lang="ts">
	import type { TooltipTriggerProps } from "./types.js";
	import { getTooltipContext } from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";

	let {
		children,
		class: className,
		...rest
	}: TooltipTriggerProps = $props();

	const transport = getTooltipContext();
</script>

<span
	{...transport.slots.trigger}
	class={cn(className)}
	data-kind="tooltip"
	data-slot="trigger"
	{...rest}
>
	{@render children?.()}
</span>
