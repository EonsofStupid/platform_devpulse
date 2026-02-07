<!--
	@component SelectItemText
	@description Structural text label within a select item.
	Contract: kind="select", slot="item-text"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { SelectItemTextProps } from "./types.js";

let { children, class: className, ...rest }: SelectItemTextProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "SelectItemText");
</script>

<span
	{...rest}
	data-kind="select"
	data-slot="item-text"
	class={cn(className)}
>
	{@render children?.()}
</span>
