<!--
	@component NavigationMenuViewport
	@description Structural shell for navigation-menu viewport.
	Contract: kind="navigation-menu", slot="viewport", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { NavigationMenuViewportProps } from "./types.js";

	let { children, class: className, ...rest }: NavigationMenuViewportProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenuViewport");
</script>

<div
	{...rest}
	data-kind="navigation-menu"
	data-slot="viewport"
	class={cn(className)}
>
	{@render children?.()}
</div>
