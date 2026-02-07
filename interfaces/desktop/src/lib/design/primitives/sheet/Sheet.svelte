<!--
	@component Sheet
	@description Root context provider for sheet primitive. No DOM element.
	Contract: kind="sheet", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setSheetContext } from "./context.js";
import type { SheetProps } from "./types.js";

let { open = $bindable(false), children }: SheetProps = $props();

setSheetContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
