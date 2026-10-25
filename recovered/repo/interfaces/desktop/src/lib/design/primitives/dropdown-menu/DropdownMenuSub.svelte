<!--
	@component DropdownMenuSub
	@description Structural shell for dropdown-menu sub.
	Contract: kind="dropdown-menu", slot="sub", ariaStateProvider="meltui"
-->
<script lang="ts">
import type { DropdownMenuSubProps } from "./types.js";

let { children }: DropdownMenuSubProps = $props();
</script>

{@render children?.()}
