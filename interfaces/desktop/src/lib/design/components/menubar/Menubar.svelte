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
		"background-color": "var(--surface-base)",
		"border-radius": "0.75rem",
		"box-shadow": "0 0.0625rem 0.1875rem oklch(0 0 0 / 0.12), 0 0.0625rem 0.125rem oklch(0 0 0 / 0.24)",
		"color": "var(--text-primary)",
		"border-color": "var(--border-subtle)",
		"border-width": "0.0625rem"
}
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { type MenubarRootCtx, setMenubarRootContext } from "./context.js";
import type { MenubarProps } from "./types.js";

let { preset = "default", children, class: className, ...rest }: MenubarProps = $props();

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

const m = $derived(renderForge({ kind: "menubar", preset }));
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
