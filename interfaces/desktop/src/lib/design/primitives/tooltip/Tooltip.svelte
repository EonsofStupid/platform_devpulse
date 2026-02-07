<!--
	@component Tooltip
	@description Root context provider for tooltip primitive. No DOM element.
	Contract: kind="tooltip", ariaStateProvider="meltui"
-->
<script lang="ts">
import { setTooltipContext } from "./context.js";
import type { TooltipProps } from "./types.js";

let { open = $bindable(false), children }: TooltipProps = $props();

setTooltipContext({
	get open() {
		return open;
	},
});
</script>

{@render children?.()}
