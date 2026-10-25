<!--
	@component ComboboxItem
	@description Structural shell for combobox selectable option.
	Contract: kind="combobox", slot="item", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ComboboxItemProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxItemProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ComboboxItem");
</script>

<div
	{...rest}
	data-kind="combobox"
	data-slot="item"
	class={cn(className)}
>
	{@render children?.()}
</div>
