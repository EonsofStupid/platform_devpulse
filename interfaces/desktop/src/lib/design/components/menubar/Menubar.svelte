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
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/utils/cn.js";
import { type MenubarRootCtx, setMenubarRootContext } from "./context.js";
import { menubarRecipe } from "./recipe.js";
import type { MenubarProps } from "./types.js";

let {
	children,
	class: className,
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
	// Rest spread
	...rest
}: MenubarProps = $props();

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

let activeMenu = $state<string | undefined>(undefined);
const recipe = menubarRecipe();

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
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="menubar"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	{@render children?.()}
</div>
