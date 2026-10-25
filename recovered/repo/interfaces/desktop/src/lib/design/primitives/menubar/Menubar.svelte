<!--
	@component Menubar
	@description Structural root container for menubar. Sets root context.
	Contract: kind="menubar", slot="root"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import { setMenubarContext } from "./context.js";
import type { MenubarProps } from "./types.js";

let { children, class: className, ...rest }: MenubarProps = $props();

setMenubarContext({});

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "Menubar");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="root"
	class={cn(className)}
>
	{@render children?.()}
</div>
