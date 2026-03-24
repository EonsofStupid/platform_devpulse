<!--
	@component Navigation Menu
	@kind navigation-menu
	@layer component
	@category composite
	@description Multi-level navigation with dropdown panels for organizing complex site hierarchies
	@container true
	@containerSlots content
	@compound true
	@blockCategory navigation
	@defaultStyle navigation-menu-default
	@styleIds navigation-menu-default
	@requiredAxes backgroundColor, border, borderRadius, shadow, color, typography
	@slots root:all, list:none, item:none, trigger:none, content:none, link:none, indicator:none, viewport:none
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
