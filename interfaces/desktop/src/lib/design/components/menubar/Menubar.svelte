<!--
	@component Menubar
	@kind menubar
	@layer component
	@category composite
	@description Horizontal bar of dropdown menus for application-level navigation and actions
	@aria https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
	@container true
	@containerSlots root
	@compound true
	@blockCategory navigation
	@defaultStyle menubar-default
	@styleIds menubar-default
	@requiredAxes backgroundColor, border, color, typography
	@slots root:all, menu:none, trigger:none, content:none, item:none, separator:none
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
import { resolveMacro, cssVarString } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { type MenubarRootCtx, setMenubarRootContext } from "./context.js";
import type { MenubarProps } from "./types.js";

let {
	preset = "default",
	children,
	class: className,
	...rest
}: MenubarProps = $props();

let activeMenu = $state<string | undefined>(undefined);

function openMenu(value: string): void {
	activeMenu = value;
}

function closeAll(): void {
	activeMenu = undefined;
}

const ctx: MenubarRootCtx = {
	get activeMenu() {
		return activeMenu;
	},
	openMenu,
	closeAll,
};

setMenubarRootContext(ctx);

const m = $derived(resolveMacro({ kind: "menubar", preset }));
</script>

<div
	role="menubar"
	aria-orientation="horizontal"
	class={cn("flex items-center", className)}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
	data-slot="root"
	{...rest}
>
	{@render children?.()}
</div>
