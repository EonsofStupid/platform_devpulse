<!--
	@component ComboboxGroup
	@description Structural shell for combobox option group.
	Contract: kind="combobox", slot="group", ariaStateProvider="meltui"
-->
<script lang="ts">
import { cn, stripStyleProp } from "../types.js";
import type { ComboboxGroupProps } from "./types.js";

let { children, class: className, ...rest }: ComboboxGroupProps = $props();

if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "ComboboxGroup");
</script>

<div
	{...rest}
	data-kind="combobox"
	data-slot="group"
	class={cn(className)}
>
	{@render children?.()}
</div>
