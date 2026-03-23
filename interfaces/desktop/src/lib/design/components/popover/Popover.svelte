<!--
	@component Popover
	@kind popover
	@layer components

	ColdLight Popover — compound component root.
	Creates MeltUI popover transport and sets context.
	Sub-components (PopoverTrigger, PopoverContent, PopoverArrow)
	consume context to access their slot attributes.

	MeltUI transport adapter provides ARIA and positioning.
	ColdLight adds data-kind, data-slot, data-state, ColdLight 8-axis visual.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/popover/
-->
<script lang="ts">
import { createPopoverTransport } from "$lib/design/api/dsadapters/meltui/_internal/popover/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setPopoverContext } from "./context.js";
import type { PopoverProps } from "./types.js";

let {
	open,
	onOpenChange,
	forceVisible = false,
	sameWidth = false,
	closeOnEscape = true,
	closeOnOutsideClick = true,
	children,
	class: className,
	size,
}: PopoverProps = $props();

const transport = createPopoverTransport({
	get open() {
		return open;
	},
	// biome-ignore lint/suspicious/noExplicitAny: callback value type from transport
	onOpenChange: (v: any) => onOpenChange?.(v),
	get forceVisible() {
		return forceVisible;
	},
	get sameWidth() {
		return sameWidth;
	},
	get closeOnEscape() {
		return closeOnEscape;
	},
	get closeOnOutsideClick() {
		return closeOnOutsideClick;
	},
});

setPopoverContext(transport);

</script>

<div
	class={cn( className)}
	data-kind="popover"
	data-slot="root"
>
	{@render children?.()}
</div>
