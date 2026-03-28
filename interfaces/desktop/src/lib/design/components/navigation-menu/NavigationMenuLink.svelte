<!--
	@component NavigationMenuLink
	@kind navigation-menu
	@slot link
	@layer components

	Navigation link within a menu item.
	ColdLight-owned ARIA: aria-current="page" when active.
	Uses semantic <a> element.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import type { NavigationMenuLinkProps } from "./types.js";

let { children, active = false, class: className, ...rest }: NavigationMenuLinkProps = $props();
</script>

<a
	aria-current={active ? "page" : undefined}
	class={cn(className)}
	data-kind="navigation-menu"
	data-slot="link"
	data-state={active ? "active" : undefined}
	{...rest}
>
	{@render children?.()}
</a>
