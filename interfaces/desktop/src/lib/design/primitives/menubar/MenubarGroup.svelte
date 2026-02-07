<!--
	@component MenubarGroup
	@description Structural grouping container for related menu items.
	Contract: kind="menubar", slot="group"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { MenubarGroupProps } from "./types.js";

let { children, class: className, ...rest }: MenubarGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarGroup");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
