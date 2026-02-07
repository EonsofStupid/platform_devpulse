<!--
	@component MenubarTrigger
	@description Structural trigger button for a menubar menu.
	Contract: kind="menubar", slot="trigger"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { getMenubarMenuContext } from "./context.js";
import type { MenubarTriggerProps } from "./types.js";

let { children, class: className, ...rest }: MenubarTriggerProps = $props();
const ctx = getMenubarMenuContext();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarTrigger");
</script>

<button
	{...rest}
	data-kind="menubar"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</button>
