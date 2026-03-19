<!--
	@component RadioGroupLabel
	@kind radio-group
	@layer components

	Radio group label — associates a text label with the group.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRadioGroupContext } from "./context.js";
import { radioGroupRecipe } from "./recipe.js";
import type { RadioGroupLabelProps } from "./types.js";

let { children, class: className, ...rest }: RadioGroupLabelProps = $props();

const transport = getRadioGroupContext();
const recipe = radioGroupRecipe();
</script>

<span
	{...transport.slots.label}
	class={cn(recipe.label, className)}
	data-kind="radio-group"
	data-slot="label"
	{...rest}
>
	{@render children?.()}
</span>
