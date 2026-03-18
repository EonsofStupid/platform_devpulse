<!--
	@component DateRangePickerField
	@kind date-range-picker
	@slot field
	@layer components

	Embedded date-range-field for direct range input.
	ColdLight-owned ARIA — wraps start/end date-field segments.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getDateRangePickerContext } from "./context.js";
import { dateRangePickerRecipe } from "./recipe.js";
import type { DateRangePickerFieldProps } from "./types.js";

let { children, class: className, ...rest }: DateRangePickerFieldProps = $props();
const ctx = getDateRangePickerContext();
const recipe = $derived(dateRangePickerRecipe({ size: ctx.size }));
</script>

<div
	role="group"
	class={cn(recipe.field, className)}
	data-kind="date-range-picker"
	data-slot="field"
	data-state={ctx.disabled ? "disabled" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
