<!--
	@component DatePicker.Input
	@kind date-picker
	@slot field
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDatePickerContext } from "./context.js";
import type { DatePickerInputProps } from "./types.js";

let { children, class: className, ...rest }: DatePickerInputProps = $props();
const ctx = getDatePickerContext();
</script>

<div
	id={ctx.ids.field}
	role="group"
	data-kind="date-picker"
	data-slot="field"
	data-state={ctx.isDisabled ? "disabled" : undefined}
	class={cn(ctx.classes.field, className)}
	{...rest}
>
	{@render children?.()}
</div>
