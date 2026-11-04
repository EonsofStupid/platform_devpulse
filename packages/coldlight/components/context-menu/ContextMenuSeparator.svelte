<!--
	@component ContextMenuSeparator
	@kind context-menu
	@slot separator
	@layer components

	Visual and semantic separator between menu items.
	ARIA: role="separator".
-->
<script lang="ts">
import { contextMenuAnatomy } from "#coldlight/behaviors/navigation/context-menu/index.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getContextMenuContext } from "./context.js";
import type { ContextMenuSeparatorProps } from "./types.js";

let { ...rest }: ContextMenuSeparatorProps = $props();

const ctx = getContextMenuContext();
const attrs = $derived(
	mergeProps(ctx.hook.menu.separator, contextMenuAnatomy.attrs.separator, rest),
);
</script>

<div {...attrs}></div>
