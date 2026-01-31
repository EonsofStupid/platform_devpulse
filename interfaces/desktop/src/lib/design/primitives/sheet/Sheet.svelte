<!--
	@component Sheet
	@description Root context provider for sheet primitive. No DOM element.
	Contract: kind="sheet", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { SheetProps } from "./types.js";
	import { setSheetContext } from "./context.js";

	let { open = $bindable(false), children }: SheetProps = $props();

	setSheetContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
