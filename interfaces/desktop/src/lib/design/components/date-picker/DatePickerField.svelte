<!--
	@component DatePickerField
	@kind date-picker
	@slot field
	@layer components

	Embedded date-field for direct date input.
	ColdLight-owned ARIA — wraps date-field segments.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDatePickerContext } from "./context.js";
import { datePickerRecipe } from "./recipe.js";
import type { DatePickerFieldProps } from "./types.js";

let { children, class: className, ...rest }: DatePickerFieldProps = $props();
const ctx = getDatePickerContext();
const recipe = $derived(datePickerRecipe({ size: ctx.size }));
</script>

<div
	role="group"
	class={cn(recipe.field, className)}
	data-kind="date-picker"
	data-slot="field"
	data-state={ctx.disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
