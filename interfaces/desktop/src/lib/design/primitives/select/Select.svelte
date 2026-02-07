<!--
	@component Select
	@description Root context provider for select primitive. No DOM element.
	Contract: kind="select", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setSelectContext } from "./context.js";
import type { SelectProps } from "./types.js";

let { open = $bindable(false), children }: SelectProps = $props();

setSelectContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
