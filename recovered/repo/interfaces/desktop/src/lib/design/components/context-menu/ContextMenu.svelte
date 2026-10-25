<!--
	@component ContextMenu
	@kind context-menu
	@layer components

	ColdLight ContextMenu root — renderless compound component root.
	Creates context with open state, position, and provides to sub-components.

	Triggered by right-click (contextmenu event) on the trigger zone.
	MeltUI spatialmenu adapter provides ARIA behavior.
	ColdLight adds data-kind, data-slot, data-state.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
-->
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { type ContextMenuCtx, setContextMenuContext } from "./context.js";
import type { ContextMenuProps } from "./types.js";

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
}: ContextMenuProps = $props();

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

let position = $state({ x: 0, y: 0 });
const contentId = `cl-ctxmenu-content-${crypto.randomUUID().slice(0, 8)}`;

function close(): void {
	open = false;
	onOpenChange?.(false);
}

const ctx: ContextMenuCtx = {
	get open() {
		return open;
	},
	close,
	get position() {
		return position;
	},
	contentId,
};

setContextMenuContext(ctx);
</script>

{@render children?.()}
