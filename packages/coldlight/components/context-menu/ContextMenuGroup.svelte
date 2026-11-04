<!--
	@component ContextMenuGroup
	@kind context-menu
	@slot group
	@layer components

	Groups related menu items with optional label.
	ARIA: role="group".
-->
<script lang="ts">
import { contextMenuAnatomy } from "#coldlight/behaviors/navigation/context-menu/index.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getContextMenuContext } from "./context.js";
import type { ContextMenuGroupProps } from "./types.js";

let { children, label, ...rest }: ContextMenuGroupProps = $props();

const ctx = getContextMenuContext();
const attrs = $derived(
	mergeProps(ctx.hook.menu.getGroup(label ?? ""), contextMenuAnatomy.attrs.group, rest),
);
</script>

<div {...attrs} aria-label={label}>
	{@render children?.()}
</div>
