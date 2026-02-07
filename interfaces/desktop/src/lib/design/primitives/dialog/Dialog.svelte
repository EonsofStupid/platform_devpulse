<!--
	@component Dialog
	@description Root context provider for dialog primitive. No DOM element.
	Contract: kind="dialog", slot="root"
-->
<script lang="ts">
import { setDialogContext } from "./context.js";
import type { DialogProps } from "./types.js";

let { open = $bindable(false), children }: DialogProps = $props();

setDialogContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
