<!--
	@component NavigationMenuLink
	@description Structural shell for navigation-menu link.
	Contract: kind="navigation-menu", slot="link", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { NavigationMenuLinkProps } from "./types.js";

let { children, class: className, ...rest }: NavigationMenuLinkProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenuLink");
</script>

<a
	{...rest}
	data-kind="navigation-menu"
	data-slot="link"
	class={cn(className)}
>
	{@render children?.()}
</a>
