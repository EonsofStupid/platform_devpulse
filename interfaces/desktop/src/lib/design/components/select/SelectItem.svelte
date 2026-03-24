<!--
	@component Select.Item
	@kind select
	@slot item
	@layer components

	Individual option. ARIA from hook.getOption() via context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import type { SelectItemProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: SelectItemProps = $props();
const ctx = getSelectContext();

const optionAttrs = $derived(ctx.hook.getOption(value, { disabled }));
</script>

<div
	{...optionAttrs}
	data-kind="select"
	data-slot="item"
	class={cn(
		"relative flex w-full cursor-pointer select-none items-center px-3 py-1.5 text-sm",
		"data-[highlighted]:bg-white/[0.04]",
		"data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
		className)}
	{...rest}
>
	{@render children?.()}
</div>
