<!--
	@component Popover
	@description Root context provider for popover primitive. No DOM element.
	Contract: kind="popover", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { PopoverProps } from "./types.js";
	import { setPopoverContext } from "./context.js";

	let { open = $bindable(false), children }: PopoverProps = $props();

	setPopoverContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
