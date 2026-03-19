<!--
	@component TooltipContent
	@kind tooltip
	@layer components

	Tooltip content panel — conditionally rendered when tooltip is open.
	MeltUI transport provides role="tooltip" and positioning attributes.
	Recipe provides visual styling.

	Only rendered when transport.states.open is true.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getTooltipContext } from "./context.js";
import { tooltipRecipe } from "./recipe.js";
import type { TooltipContentProps } from "./types.js";

let { children, class: className, ...rest }: TooltipContentProps = $props();

const transport = getTooltipContext();
const recipe = tooltipRecipe();
</script>

{#if transport.states.open}
	<div
		{...transport.slots.content}
		class={cn(recipe.content, className)}
		data-kind="tooltip"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
