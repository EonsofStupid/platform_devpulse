<!--
	@component ContextMenu
	@kind context-menu
	@layer components

	ColdLight ContextMenu root — renderless compound component root.
	Creates the behavior with open state and position, and provides it to sub-components.

	Triggered by right-click (contextmenu event) on the trigger zone.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
-->
<script lang="ts">
import { useContextMenu } from "#coldlight/behaviors/navigation/context-menu/index.js";
import { setContextMenuContext } from "./context.js";
import type { ContextMenuProps } from "./types.js";

let {
	open = $bindable(false),
	onOpenChange,
	"aria-label": label,
	children,
}: ContextMenuProps = $props();

const hook = useContextMenu({
	get open() {
		return open;
	},
	onOpenChange: (next) => {
		open = next;
		onOpenChange?.(next);
	},
	get "aria-label"() {
		return label;
	},
});

setContextMenuContext({
	get hook() {
		return hook;
	},
});

// A bound or passed `open` drives the menu, at the last position.
$effect(() => {
	if (open !== hook.menu.open) hook.menu.setOpen(open);
});
</script>

{@render children?.()}
