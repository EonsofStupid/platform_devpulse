<!--
	@component Tooltip.Content
	@kind tooltip
	@slot content
	@layer components

	Floating tooltip content. StyleMacro (visual). Visible when hook.open.
-->
<script lang="ts">
import { tooltipAnatomy } from "#coldlight/behaviors/overlays/tooltip/index.js";
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { getTooltipContext } from "./context.js";
import type { TooltipContentProps } from "./types.js";

let { preset = "default", children, class: className, ...rest }: TooltipContentProps = $props();
const ctx = getTooltipContext();

const m = $derived(renderForge({ kind: "tooltip", preset }));
</script>

{#if ctx.hook.open}
		<div
			{...tooltipAnatomy.attrs.content}
			{...ctx.hook.content}
			{...rest}
			{...m.dataAttrs}
			style={cssVarString(m.cssVars)}
			class={cn("absolute z-50 px-3 py-1.5 text-sm rounded-md", className)}
		>
			{@render children?.()}
		</div>
{/if}
