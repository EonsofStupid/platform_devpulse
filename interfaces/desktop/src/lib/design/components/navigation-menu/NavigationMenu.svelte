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
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import { type NavigationMenuRootCtx, setNavigationMenuRootContext } from "./context.js";
import type { NavigationMenuProps } from "./types.js";

let {
	children,
	"aria-label": ariaLabel = "Main navigation",
	class: className,
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

const m = $derived(resolveMacro({ kind: "navigation-menu", preset: "default" }));
</script>

<nav
	aria-label={ariaLabel}
	class={cn("relative", className)}
	{...m.dataAttrs}
	style={cssVarString(m.cssVars)}
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
