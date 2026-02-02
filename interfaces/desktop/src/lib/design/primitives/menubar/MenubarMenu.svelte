<!--
	@component MenubarMenu
	@description Renderless context provider for a single menu within the menubar.
	Contract: kind="menubar", slot="menu"
-->
<script lang="ts">
	import type { MenubarMenuProps } from "./types.js";
	import { setMenubarMenuContext } from "./context.js";

	let { open = $bindable(false), children }: MenubarMenuProps = $props();

	setMenubarMenuContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
