<!--
	@component ContextMenu
	@description Root context provider for context-menu primitive. No DOM element.
	Contract: kind="context-menu", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setContextMenuContext } from "./context.js";
import type { ContextMenuProps } from "./types.js";

let { open = $bindable(false), children }: ContextMenuProps = $props();

setContextMenuContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
