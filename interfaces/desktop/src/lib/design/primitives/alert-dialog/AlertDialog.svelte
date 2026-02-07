<!--
	@component AlertDialog
	@description Root context provider for alert-dialog primitive. No DOM element.
	Contract: kind="alert-dialog", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setAlertDialogContext } from "./context.js";
import type { AlertDialogProps } from "./types.js";

let { open = $bindable(false), children }: AlertDialogProps = $props();

setAlertDialogContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
