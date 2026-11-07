<!--
	@component MenubarRadioGroup
	@description Structural exclusive selection group within a menu.
	Contract: kind="menubar", slot="radio-group"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { MenubarRadioGroupProps } from "./types.js";

let { children, class: className, ...rest }: MenubarRadioGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "MenubarRadioGroup");
</script>

<div
	{...rest}
	data-kind="menubar"
	data-slot="radio-group"
	class={cn(className)}
>
	{@render children?.()}
</div>
