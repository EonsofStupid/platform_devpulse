<!--
	@component DateRangeFieldEnd
	@kind date-range-field
	@slot end-field
	@layer components

	End date field container for range input.
	ColdLight-owned ARIA — role="group" with aria-label.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateRangeFieldContext } from "./context.js";
import type { DateRangeFieldEndProps } from "./types.js";

let { children, class: className, ...rest }: DateRangeFieldEndProps = $props();
const ctx = getDateRangeFieldContext();
</script>

<div
	role="group"
	aria-label="End date"
	class={cn(className, className)}
	data-kind="date-range-field"
	data-slot="end-field"
	data-state={ctx.disabled ? "disabled" : ctx.focusedField === "end" ? "focused" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
