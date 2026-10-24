<!--
	@component Select.Label
	@kind select
	@slot label
	@layer components

	Accessible label for the select. ARIA from hook via context.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getSelectContext } from "./context.js";
import type { SelectLabelProps } from "./types.js";

let { children, class: className, ...rest }: SelectLabelProps = $props();
const ctx = getSelectContext();
</script>

<label
	{...ctx.hook.label}
	data-kind="select"
	data-slot="label"
	class={cn("text-sm font-medium", className)}
	{...rest}
>
	{@render children?.()}
</label>
