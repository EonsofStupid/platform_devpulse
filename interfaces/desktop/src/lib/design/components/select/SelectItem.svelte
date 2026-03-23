<!--
	@component SelectItem
	@kind select
	@layer components

	Individual select option — role="option", aria-selected.
	MeltUI transport provides ARIA attributes via transport.item(value).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import { selectComposition } from "./composition.js";
import type { SelectItemProps } from "./types.js";

let { value, children, class: className, ...rest }: SelectItemProps = $props();

const transport = getSelectContext();
const composition = selectComposition();
</script>

<div
	{...transport.item(value)}
	class={cn(composition.item, className)}
	data-kind="select"
	data-slot="item"
	{...rest}
>
	{@render children?.()}
</div>
