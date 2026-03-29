<!--
	@component Tooltip
	@kind tooltip
	@layer component
	@category feedback
	@description Floating text label that appears on hover or focus to provide supplementary information
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
	@container false
	@compound true
	@blockCategory utility
	@defaultStyle tooltip-default
	@styleIds tooltip-default
	@requiredAxes backgroundColor, borderRadius, shadow, color, typography
	@slots root:all, trigger:none, content:none, arrow:none
	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0.8)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "oklch(0.9319 0.015 224)",
		"border-color": "oklch(0.4234 0.081 173.37 / 0.22)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { useTooltip } from "$lib/design/behaviors/tooltip/use-tooltip.svelte.js";
import { setTooltipContext } from "./context.js";
import type { TooltipProps } from "./types.js";

let { openDelay = 700, closeDelay = 300, children }: TooltipProps = $props();

const hook = useTooltip({
	get openDelay() {
		return openDelay;
	},
	get closeDelay() {
		return closeDelay;
	},
});

setTooltipContext({
	get hook() {
		return hook;
	},
});
</script>

{@render children?.()}
