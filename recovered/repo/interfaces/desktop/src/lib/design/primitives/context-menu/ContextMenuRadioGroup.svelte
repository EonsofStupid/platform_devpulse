<!--
	@component ContextMenuRadioGroup
	@description Structural mutually exclusive group of radio items for context-menu.
	Contract: kind="context-menu", slot="radio-group"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ContextMenuRadioGroupProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuRadioGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ContextMenuRadioGroup");
</script>

<div
	{...rest}
	data-kind="context-menu"
	data-slot="radio-group"
	class={cn(className)}
>
	{@render children?.()}
</div>
