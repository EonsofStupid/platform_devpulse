<!--
	@component NavigationMenuTrigger
	@description Structural shell for navigation-menu trigger.
	Contract: kind="navigation-menu", slot="trigger", ariaStateProvider="coldlight"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { NavigationMenuTriggerProps } from "./types.js";

let { children, class: className, ...rest }: NavigationMenuTriggerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "NavigationMenuTrigger");
</script>

<button
	{...rest}
	data-kind="navigation-menu"
	data-slot="trigger"
	class={cn(className)}
>
	{@render children?.()}
</button>
