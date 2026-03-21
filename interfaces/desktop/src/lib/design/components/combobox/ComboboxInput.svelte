<!--
	@component Combobox.Input
	@kind combobox
	@slot input
	@layer components

	role="combobox" text input. All ARIA from useComboBox() hook.
	Focus stays here — options highlighted via aria-activedescendant.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxInputProps } from "./types.js";

let { class: className, placeholder }: ComboboxInputProps = $props();
const ctx = getComboboxContext();
</script>

<input
	{...ctx.hook.input}
	class={cn(ctx.classes.input, className)}
	data-state={ctx.hook.open ? "open" : "closed"}
	{placeholder}
/>
