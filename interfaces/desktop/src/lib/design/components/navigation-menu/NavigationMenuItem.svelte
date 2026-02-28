<!--
	@component NavigationMenuItem
	@kind navigation-menu
	@slot item
	@layer components

	Individual navigation item within the menu.
	Can contain either a direct link or a trigger + content (sub-menu).
	Sets per-item context for trigger/content children.
-->
<script lang="ts">
	import type { NavigationMenuItemProps } from "./types.js";
	import {
		getNavigationMenuRootContext,
		setNavigationMenuItemContext,
		type NavigationMenuItemCtx,
	} from "./context.js";
	import { cn } from "$lib/design/primitives/types.js";
	import { navigationMenuRecipe } from "./recipe.js";

	let { children, value, class: className, ...rest }: NavigationMenuItemProps = $props();

	const root = getNavigationMenuRootContext();
	const fallbackId = `nav-item-${crypto.randomUUID().slice(0, 8)}`;
	const itemValue = $derived(value ?? fallbackId);
	const triggerId = $derived(`cl-nav-trigger-${itemValue}`);
	const contentId = $derived(`cl-nav-content-${itemValue}`);

	const isOpen = $derived(root.activeItem === itemValue);

	function toggle(): void {
		if (isOpen) {
			root.closeAll();
		} else {
			root.openItem(itemValue);
		}
	}

	function close(): void {
		root.closeAll();
	}

	const ctx: NavigationMenuItemCtx = {
		get open() { return isOpen; },
		toggle,
		close,
		get triggerId() { return triggerId; },
		get contentId() { return contentId; },
		get value() { return itemValue; },
	};

	setNavigationMenuItemContext(ctx);

	const recipe = navigationMenuRecipe();
</script>

<li
	class={cn(recipe.item, className)}
	data-kind="navigation-menu"
	data-slot="item"
	data-state={isOpen ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</li>
