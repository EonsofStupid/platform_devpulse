<!--
	@component ContextMenuContent
	@kind context-menu
	@slot content
	@layer components

	Menu content container — positioned at right-click coordinates.
	ARIA: role="menu". Escape, outside press and arrow keys from the behavior.
	Portalled to the page's end: inside a glass surface (backdrop-filter) a fixed
	element would be placed against that surface instead of the viewport.
	Its look is context-menu.tokens.json's generated CSS.
-->
<script lang="ts">
import { portal } from "#coldlight/actions/index.js";
import { contextMenuAnatomy } from "#coldlight/behaviors/navigation/context-menu/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getContextMenuContext } from "./context.js";
import { CONTEXT_MENU_DEFAULTS } from "./context-menu.generated.js";
import type { ContextMenuContentProps } from "./types.js";

let {
	children,
	variant = CONTEXT_MENU_DEFAULTS.variant,
	surface,
	size = CONTEXT_MENU_DEFAULTS.size,
	class: className,
	...rest
}: ContextMenuContentProps = $props();

const ctx = getContextMenuContext();
const attrs = $derived(mergeProps(ctx.hook.menu.content, contextMenuAnatomy.attrs.content, rest));
</script>

{#if ctx.hook.menu.open}
	<div
		{...attrs}
		use:portal
		use:ctx.hook.attachContent
		{...styleAttrs({ kind: "context-menu", variant, size, surface })}
		data-slot="content"
		style:left="{ctx.hook.position.x}px"
		style:top="{ctx.hook.position.y}px"
		class={cn("fixed z-50 overflow-hidden", className)}
	>
		{@render children?.()}
	</div>
{/if}
