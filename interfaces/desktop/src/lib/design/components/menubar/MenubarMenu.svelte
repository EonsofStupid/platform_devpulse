<!--
	@component MenubarMenu
	@kind menubar
	@slot menu
	@layer components

	Individual menu within the menubar. Renderless wrapper that provides
	per-menu context (open state, trigger/content IDs) to its children.
-->
<script lang="ts">
	import type { MenubarMenuProps } from "./types.js";
	import { getMenubarRootContext, setMenubarMenuContext, type MenubarMenuCtx } from "./context.js";

	let {
		open = $bindable(false),
		onOpenChange,
		children,
	}: MenubarMenuProps = $props();

	const root = getMenubarRootContext();
	const value = `menu-${crypto.randomUUID().slice(0, 8)}`;
	const triggerId = `cl-menubar-trigger-${value}`;
	const contentId = `cl-menubar-content-${value}`;

	// Derive open from root context
	const isOpen = $derived(root.activeMenu === value);

	function toggle(): void {
		if (isOpen) {
			root.closeAll();
			onOpenChange?.(false);
		} else {
			root.openMenu(value);
			onOpenChange?.(true);
		}
	}

	function close(): void {
		root.closeAll();
		onOpenChange?.(false);
	}

	const ctx: MenubarMenuCtx = {
		get open() { return isOpen; },
		toggle,
		close,
		triggerId,
		contentId,
		value,
	};

	setMenubarMenuContext(ctx);
</script>

<div
	data-kind="menubar"
	data-slot="menu"
	data-state={isOpen ? "open" : "closed"}
>
	{@render children?.()}
</div>
