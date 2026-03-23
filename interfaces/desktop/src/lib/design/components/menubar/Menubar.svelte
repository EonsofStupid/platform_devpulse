<!--
	@component Menubar
	@kind menubar
	@slot root
	@layer components

	ColdLight Menubar root — horizontal menu bar container.
	ARIA: role="menubar", aria-orientation="horizontal".
	Creates root context for menu coordination (only one menu open at a time).

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { type MenubarRootCtx, setMenubarRootContext } from "./context.js";
import { menubarComposition } from "./composition.js";
import type { MenubarProps } from "./types.js";

let {
	children,
	class: className,
	size,
	...rest
}: MenubarProps = $props();

let activeMenu = $state<string | undefined>(undefined);
const composition = menubarComposition();

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
</script>

<div
	role="menubar"
	aria-orientation="horizontal"
	class={cn(composition.root, className)}
	data-kind="menubar"
	data-slot="root"
	{...rest}
>
	{@render children?.()}
</div>
