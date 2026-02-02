<!--
	@component NavigationMenu
	@description Structural shell for navigation-menu primitive.
	Contract: kind="navigation-menu", slot="root", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { NavigationMenuProps } from "./types.js";
	import { setNavigationMenuContext } from "./context.js";

	let { value = $bindable(""), children, class: className, ...rest }: NavigationMenuProps = $props();

	setNavigationMenuContext({
		get value() {
			return value;
		},
	});

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenu");
</script>

<nav
	{...rest}
	data-kind="navigation-menu"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</nav>
