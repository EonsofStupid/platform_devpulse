<!--
	@component DateRangeFieldStart
	@kind date-range-field
	@slot start-field
	@layer components

	Start date field container for range input.
	ColdLight-owned ARIA — role="group" with aria-label.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getDateRangeFieldContext } from "./context.js";
import type { DateRangeFieldStartProps } from "./types.js";

let { children, class: className, ...rest }: DateRangeFieldStartProps = $props();
const ctx = getDateRangeFieldContext();
</script>

<div
	role="group"
	aria-label="Start date"
	class={cn(className, className)}
	data-kind="date-range-field"
	data-slot="start-field"
	data-state={ctx.disabled ? "disabled" : ctx.focusedField === "start" ? "focused" : undefined}
	{...rest}
>
	{@render children?.()}
</div>
