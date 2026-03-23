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
import { createTooltipTransport } from "$lib/design/api/dsadapters/meltui/_internal/tooltip/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setTooltipContext } from "./context.js";
import type { TooltipProps } from "./types.js";

let {
	openDelay = 700,
	closeDelay = 300,
	open,
	onOpenChange,
	closeOnPointerDown = true,
	disableHoverableContent = false,
	forceVisible = false,
	children,
	class: className,
	size,
}: TooltipProps & { class?: string } = $props();

const transport = createTooltipTransport({
	get openDelay() {
		return openDelay;
	},
	get closeDelay() {
		return closeDelay;
	},
	get open() {
		return open;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onOpenChange: (v: any) => onOpenChange?.(v),
	get closeOnPointerDown() {
		return closeOnPointerDown;
	},
	get disableHoverableContent() {
		return disableHoverableContent;
	},
	get forceVisible() {
		return forceVisible;
	},
});

setTooltipContext(transport);

</script>

<div
	class={cn( className)}
	data-kind="tooltip"
	data-slot="root"
>
	{@render children?.()}
</div>
