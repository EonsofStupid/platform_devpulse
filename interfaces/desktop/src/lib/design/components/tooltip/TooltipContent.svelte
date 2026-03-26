<!--
	@component Tooltip.Content
	@kind tooltip
	@slot content
	@layer components

	Floating tooltip content. StyleMacro (visual). Visible when hook.open.
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getTooltipContext } from "./context.js";

let { intent = "default", children, class: className, ...rest }: { intent?: import("./types.js").TooltipIntent; children?: import("svelte").Snippet; class?: string; [key: string]: unknown } = $props();
const ctx = getTooltipContext();

</script>

{#if ctx.hook.open}
	<StyleMacro kind="tooltip" intent={intent}>
		<div
			{...ctx.hook.content}
			data-kind="tooltip"
			data-slot="content"
			class={cn("absolute z-50 px-3 py-1.5 text-sm rounded-md", className)}
			{...rest}
		>
			{@render children?.()}
		</div>
	</StyleMacro>
{/if}
