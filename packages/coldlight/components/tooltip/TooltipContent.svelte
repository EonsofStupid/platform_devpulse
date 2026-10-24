<!--
	@component Tooltip.Content
	@kind tooltip
	@slot content
	@layer components

	Floating tooltip content. StyleMacro (visual). Visible when hook.open.
-->
<script lang="ts">
import { tooltipAnatomy } from "#coldlight/behaviors/overlays/tooltip/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { getTooltipContext } from "./context.js";
import { TOOLTIP_DEFAULTS } from "./tooltip.generated.js";
import type { TooltipContentProps } from "./types.js";

let {
	variant = TOOLTIP_DEFAULTS.variant,
	surface,
	children,
	class: className,
	...rest
}: TooltipContentProps = $props();
const ctx = getTooltipContext();
</script>

{#if ctx.hook.open}
		<div
			{...tooltipAnatomy.attrs.content}
			{...ctx.hook.content}
			{...rest}
			{...styleAttrs({ kind: "tooltip", variant, surface })}
			class={cn("absolute z-50 px-3 py-1.5", className)}
		>
			{@render children?.()}
		</div>
{/if}
