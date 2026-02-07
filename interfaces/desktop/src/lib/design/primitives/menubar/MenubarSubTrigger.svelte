<!--
	@component MenubarSubTrigger
	@description Structural element that opens a submenu.
	Contract: kind="menubar", slot="sub-trigger"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { MenubarSubTriggerProps } from "./types.js";

let { children, class: className, ...rest }: MenubarSubTriggerProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarSubTrigger");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="sub-trigger"
	class={cn(className)}
>
	{@render children?.()}
</div>
