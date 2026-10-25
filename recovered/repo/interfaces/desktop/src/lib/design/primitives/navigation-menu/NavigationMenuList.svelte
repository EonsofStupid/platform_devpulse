<!--
	@component NavigationMenuList
	@description Structural shell for navigation-menu list.
	Contract: kind="navigation-menu", slot="list", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { NavigationMenuListProps } from "./types.js";

let { children, class: className, ...rest }: NavigationMenuListProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenuList");
</script>

<ul
	{...rest}
	data-kind="navigation-menu"
	data-slot="list"
	class={cn(className)}
>
	{@render children?.()}
</ul>
