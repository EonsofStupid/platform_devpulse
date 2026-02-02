<!--
	@component ContextMenuSub
	@description Renderless container for a context-menu submenu. No DOM element.
	Contract: kind="context-menu", slot="sub"
-->
<script lang="ts">
	import type { ContextMenuSubProps } from "./types.js";

	let { children }: ContextMenuSubProps = $props();
</script>

{@render children?.()}
