<!--
	@component NavigationMenuContent
	@description Structural shell for navigation-menu content.
	Contract: kind="navigation-menu", slot="content", ariaStateProvider="coldlight"
-->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { NavigationMenuContentProps } from "./types.js";

	let { children, class: className, ...rest }: NavigationMenuContentProps = $props();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenuContent");
</script>

<div
	{...rest}
	data-kind="navigation-menu"
	data-slot="content"
	class={cn(className)}
>
	{@render children?.()}
</div>
