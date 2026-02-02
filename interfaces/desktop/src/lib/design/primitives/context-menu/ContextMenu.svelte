<!--
	@component ContextMenu
	@description Root context provider for context-menu primitive. No DOM element.
	Contract: kind="context-menu", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { ContextMenuProps } from "./types.js";
	import { setContextMenuContext } from "./context.js";

	let { open = $bindable(false), children }: ContextMenuProps = $props();

	setContextMenuContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
