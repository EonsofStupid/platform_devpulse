<!--
	@component RadioGroup.Label
	@kind radio-group
	@slot label
	@layer components

	Label for a radio item. ARIA from hook.getLabel(value).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRadioGroupContext } from "./context.js";
import type { RadioGroupLabelProps } from "./types.js";

let { value, children, class: className, ...rest }: RadioGroupLabelProps = $props();
const ctx = getRadioGroupContext();

const labelAttrs = $derived(ctx.hook.getLabel(value));
</script>

<span
	{...labelAttrs}
	data-kind="radio-group"
	data-slot="label"
	class={cn("text-sm cursor-pointer", className)}
	{...rest}
>
	{@render children?.()}
</span>
