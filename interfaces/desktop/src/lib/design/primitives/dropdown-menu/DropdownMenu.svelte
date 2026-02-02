<!--
	@component DropdownMenu
	@description Structural shell for dropdown-menu primitive.
	Contract: kind="dropdown-menu", slot="root", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { DropdownMenuProps } from "./types.js";
	import { setDropdownMenuContext } from "./context.js";

	let { open = $bindable(false), children }: DropdownMenuProps = $props();

	setDropdownMenuContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
