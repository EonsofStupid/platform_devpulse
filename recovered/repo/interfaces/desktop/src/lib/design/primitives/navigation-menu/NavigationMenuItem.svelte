<!--
	@component NavigationMenuItem
	@description Structural shell for navigation-menu item.
	Contract: kind="navigation-menu", slot="item", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { NavigationMenuItemProps } from "./types.js";

let { children, class: className, ...rest }: NavigationMenuItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenuItem");
</script>

<li
	{...rest}
	data-kind="navigation-menu"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</li>
