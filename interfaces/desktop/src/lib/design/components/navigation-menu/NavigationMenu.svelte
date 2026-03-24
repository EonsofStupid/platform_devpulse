<!--
	@component NavigationMenu
	@kind navigation-menu
	@slot root
	@layer components

	ColdLight NavigationMenu root — semantic <nav> element with <ul> list.
	ColdLight OWNS all ARIA. No MeltUI dependency.
	Uses roving tabindex across top-level items.

	ARIA: role="navigation" (implicit via <nav>), aria-label.

	WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
-->
<script lang="ts">
import { StyleMacro } from "$lib/design/style/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { type NavigationMenuRootCtx, setNavigationMenuRootContext } from "./context.js";
import type { NavigationMenuProps } from "./types.js";

let {
	children,
	"aria-label": ariaLabel = "Main navigation",
	class: className,
	size,
	...rest
}: NavigationMenuProps = $props();

let activeItem = $state<string | undefined>(undefined);

function openItem(value: string): void {
	activeItem = value;
}

function closeAll(): void {
	activeItem = undefined;
}

const ctx: NavigationMenuRootCtx = {
	get activeItem() {
		return activeItem;
	},
	openItem,
	closeAll,
};

setNavigationMenuRootContext(ctx);
</script>

<StyleMacro kind="navigation-menu" style="navigation-menu-default">
	<nav
		aria-label={ariaLabel}
		class={cn("relative", className)}
		data-kind="navigation-menu"
		data-slot="root"
		{...rest}
	>
		<ul
			class="flex items-center gap-1"
			data-kind="navigation-menu"
			data-slot="list"
		>
			{@render children?.()}
		</ul>
	</nav>
</StyleMacro>
