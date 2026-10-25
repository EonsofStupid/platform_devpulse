<!--
	@component MenubarSub
	@description Renderless provider for a submenu. No DOM element.
	Contract: kind="menubar", slot="sub"
-->
<script lang="ts">
import type { MenubarSubProps } from "./types.js";

let { children }: MenubarSubProps = $props();
</script>

{@render children?.()}
