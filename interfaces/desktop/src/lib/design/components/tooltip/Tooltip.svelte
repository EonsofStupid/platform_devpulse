<!--
	@component Tooltip
	@kind tooltip
	@layer components

	ColdLight Tooltip — compound component root (renderless provider).
	Creates MeltUI tooltip transport and sets context.
	Sub-components (TooltipTrigger, TooltipContent) consume context
	to access their slot attributes and refs.

	MeltUI transport adapter provides ARIA and positioning.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
-->
<script lang="ts">
	import type { TooltipProps } from "./types.js";
	import { createTooltipTransport } from "$lib/design/api/adapters/meltui/_internal/tooltip/index.js";
	import { setTooltipContext } from "./context.js";

	let {
		openDelay = 700,
		closeDelay = 300,
		open,
		onOpenChange,
		closeOnPointerDown = true,
		disableHoverableContent = false,
		forceVisible = false,
		children,
	}: TooltipProps = $props();

	const transport = createTooltipTransport({
		get openDelay() { return openDelay; },
		get closeDelay() { return closeDelay; },
		get open() { return open; },
		onOpenChange: (v: any) => onOpenChange?.(v),
		get closeOnPointerDown() { return closeOnPointerDown; },
		get disableHoverableContent() { return disableHoverableContent; },
		get forceVisible() { return forceVisible; },
	});

	setTooltipContext(transport);
</script>

{@render children?.()}
