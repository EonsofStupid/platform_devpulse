<!--
	@component DropdownMenu
	@kind dropdown-menu
	@layer components

	ColdLight DropdownMenu root — renderless compound component root.
	Creates context with open state and provides to sub-components.

	MeltUI spatialmenu adapter provides ARIA behavior.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { type DropdownMenuContext, setDropdownMenuContext } from "./context.js";
import type { DropdownMenuProps } from "./types.js";

let {
	open = $bindable(false),
	onOpenChange,
	children,
	// ColdLight 8-axis props
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}: DropdownMenuProps = $props();

const visual = useColdLight(() => ({
	preset,
	surface,
	material,
	depth,
	bevel,
	glow,
	frame,
	motion,
	transition,
	encoding,
	radius,
	size,
}));

const triggerId = `cl-dropdown-trigger-${crypto.randomUUID().slice(0, 8)}`;
const contentId = `cl-dropdown-content-${crypto.randomUUID().slice(0, 8)}`;

function toggle(): void {
	open = !open;
	onOpenChange?.(open);
}

function close(): void {
	open = false;
	onOpenChange?.(false);
}

const ctx: DropdownMenuContext = {
	get open() {
		return open;
	},
	toggle,
	close,
	triggerId,
	contentId,
};

setDropdownMenuContext(ctx);
</script>

{@render children?.()}
