<!--
	@component Tooltip (Root)
	@kind tooltip
	@layer components

	Hover/focus tooltip. Hook (ARIA) + StyleMacro (visual).
	Compound: Trigger, Content.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
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
