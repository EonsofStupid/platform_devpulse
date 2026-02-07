<!--
	@component DropdownMenu
	@description Structural shell for dropdown-menu primitive.
	Contract: kind="dropdown-menu", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setDropdownMenuContext } from "./context.js";
import type { DropdownMenuProps } from "./types.js";

let { open = $bindable(false), children }: DropdownMenuProps = $props();

setDropdownMenuContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
