<!--
	@component Tooltip.Content
	@kind tooltip
	@slot content
	@layer components

	Floating tooltip content. StyleMacro (visual). Visible when hook.open.
-->
<script lang="ts">
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { getTooltipContext } from "./context.js";

let {
	preset = "default",
	children,
	class: className,
	...rest
}: {
	preset?: import("./types.js").TooltipPreset;
	children?: import("svelte").Snippet;
	class?: string;
	[key: string]: unknown;
} = $props();
const ctx = getTooltipContext();

const m = $derived(resolveMacro({ kind: "tooltip", preset }));
</script>

{#if ctx.hook.open}
		<div
			{...ctx.hook.content}
			{...m.dataAttrs}
			style={cssVarString(m.cssVars)}
			data-slot="content"
			class={cn("absolute z-50 px-3 py-1.5 text-sm rounded-md", className)}
			{...rest}
		>
			{@render children?.()}
		</div>
{/if}
