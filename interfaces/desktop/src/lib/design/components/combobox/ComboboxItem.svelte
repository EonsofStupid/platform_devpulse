<!--
	@component Combobox.Item
	@kind combobox
	@slot option
	@layer components

	Individual option — role="option", aria-selected from hook.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxItemProps } from "./types.js";

let { value, disabled, children, class: className }: ComboboxItemProps = $props();
const ctx = getComboboxContext();

const optionAttrs = $derived(ctx.hook.getOption(value, { disabled }));
const isSelected = $derived(ctx.hook.selectedValue === value);
</script>

<div
	{...optionAttrs}
	class={cn(className)}
	data-state={isSelected ? "selected" : undefined}
>
	{@render children?.()}
</div>
