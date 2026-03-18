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
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { cn } from "$lib/design/primitives/types.js";
import { type NavigationMenuRootCtx, setNavigationMenuRootContext } from "./context.js";
import { navigationMenuRecipe } from "./recipe.js";
import type { NavigationMenuProps } from "./types.js";

let {
	children,
	"aria-label": ariaLabel = "Main navigation",
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
}: NavigationMenuProps = $props();

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

let activeItem = $state<string | undefined>(undefined);
const recipe = navigationMenuRecipe();

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

<nav
	aria-label={ariaLabel}
	class={cn(recipe.root, visual.segments, visual.radius, className)}
	data-kind="navigation-menu"
	data-slot="root"
	data-encoding={visual.encoding || undefined}
	{...rest}
>
	<ul
		class={recipe.list}
		data-kind="navigation-menu"
		data-slot="list"
	>
		{@render children?.()}
	</ul>
</nav>
