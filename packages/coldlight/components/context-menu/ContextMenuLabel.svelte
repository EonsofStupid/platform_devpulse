<!--
	@component ContextMenuLabel
	@kind context-menu
	@slot group-label
	@layer components

	Label for a group of menu items. Non-interactive.
-->
<script lang="ts">
import { contextMenuAnatomy } from "#coldlight/behaviors/navigation/context-menu/index.js";
import type { ContextMenuLabelProps } from "./types.js";

let { children, ...rest }: ContextMenuLabelProps = $props();
</script>

<div {...contextMenuAnatomy.attrs["group-label"]} {...rest}>
	{@render children?.()}
</div>
