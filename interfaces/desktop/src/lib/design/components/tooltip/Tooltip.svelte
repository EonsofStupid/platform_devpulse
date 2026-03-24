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
-->
<script lang="ts">
import { useTooltip } from "$lib/design/primitives/tooltip/use-tooltip.svelte.js";
import { setTooltipContext } from "./context.js";

let {
	openDelay = 700,
	closeDelay = 300,
	children,
}: { openDelay?: number; closeDelay?: number; children?: import("svelte").Snippet } = $props();

const hook = useTooltip({ openDelay, closeDelay });

setTooltipContext({
	get hook() { return hook; },
});
</script>

{@render children?.()}
