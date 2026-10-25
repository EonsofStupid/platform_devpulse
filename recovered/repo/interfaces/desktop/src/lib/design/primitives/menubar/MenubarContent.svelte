<!--
	@component MenubarContent
	@description Structural dropdown panel for a menubar menu.
	Contract: kind="menubar", slot="content"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getMenubarMenuContext } from "./context.js";
import type { MenubarContentProps } from "./types.js";

let { children, class: className, ...rest }: MenubarContentProps = $props();
const ctx = getMenubarMenuContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarContent");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
