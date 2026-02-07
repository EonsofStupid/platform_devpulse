<!--
	@component Popover
	@description Root context provider for popover primitive. No DOM element.
	Contract: kind="popover", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setPopoverContext } from "./context.js";
import type { PopoverProps } from "./types.js";

let { open = $bindable(false), children }: PopoverProps = $props();

setPopoverContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
