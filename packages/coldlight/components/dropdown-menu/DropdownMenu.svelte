<!--
	@component DropdownMenu
	@kind dropdown-menu
	@layer components

	ColdLight DropdownMenu root. Creates the menu behavior with the open state and
	provides it to the sub-components; anchors the content.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import { useMenu } from "#coldlight/behaviors/navigation/menu/index.js";
import { cssVarString, renderForge } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { setDropdownMenuContext } from "./context.js";
import type { DropdownMenuProps } from "./types.js";

let {
	open = $bindable(false),
	onOpenChange,
	children,
	class: className,
	...rest
}: DropdownMenuProps = $props();

const hook = useMenu({
	get open() {
		return open;
	},
	onOpenChange: (next) => {
		open = next;
		onOpenChange?.(next);
	},
});

setDropdownMenuContext({
	get hook() {
		return hook;
	},
});

// A bound or passed `open` drives the menu.
$effect(() => {
	if (open !== hook.open) hook.setOpen(open);
});

const m = $derived(renderForge({ kind: "dropdown-menu" }));
</script>

<div
	{...dropdownMenuAnatomy.attrs.root}
	{...rest}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	class={cn("relative inline-block", className)}
>
	{@render children?.()}
</div>
