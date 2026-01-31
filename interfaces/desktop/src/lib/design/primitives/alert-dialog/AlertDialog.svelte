<!--
	@component AlertDialog
	@description Root context provider for alert-dialog primitive. No DOM element.
	Contract: kind="alert-dialog", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { AlertDialogProps } from "./types.js";
	import { setAlertDialogContext } from "./context.js";

	let { open = $bindable(false), children }: AlertDialogProps = $props();

	setAlertDialogContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
