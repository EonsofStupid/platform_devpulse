<!--
	@component Tooltip
	@description Root context provider for tooltip primitive. No DOM element.
	Contract: kind="tooltip", ariaStateProvider="meltui"
-->
<script lang="ts">
	import type { TooltipProps } from "./types.js";
	import { setTooltipContext } from "./context.js";

	let { open = $bindable(false), children }: TooltipProps = $props();

	setTooltipContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
