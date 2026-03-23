<!--
	@component RadioGroupItem
	@kind radio-group
	@layer components

	Individual radio button — role="radio", aria-checked.
	MeltUI transport provides all ARIA and keyboard handling via item(value).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRadioGroupContext } from "./context.js";
import { radioGroupComposition } from "./composition.js";
import type { RadioGroupItemProps } from "./types.js";

let { value, children, class: className, ...rest }: RadioGroupItemProps = $props();

const transport = getRadioGroupContext();
const composition = radioGroupComposition();
</script>

<button
	{...transport.item(value)}
	class={cn(composition.item, className)}
	data-kind="radio-group"
	data-slot="item"
	{...rest}
>
	{@render children?.()}
</button>
