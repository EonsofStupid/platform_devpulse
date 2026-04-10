<!--
	@component RadioGroup.Label
	@kind radio-group
	@slot label
	@layer components

	Label for a radio item. ARIA from hook.getLabel(value).
-->
<script lang="ts">
import { radioGroupAnatomy } from "$lib/design/behaviors/inputs/radio-group/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { getRadioGroupContext } from "./context.js";
import type { RadioGroupLabelProps } from "./types.js";

let { value, children, class: className, ...rest }: RadioGroupLabelProps = $props();
const ctx = getRadioGroupContext();

const labelAttrs = $derived(ctx.hook.getLabel(value));
</script>

<span
	{...radioGroupAnatomy.attrs.label}
	{...labelAttrs}
	{...rest}
	class={cn("text-sm cursor-pointer", className)}
>
	{@render children?.()}
</span>
