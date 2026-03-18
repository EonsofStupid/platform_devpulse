<!--
	@component RadioGroupItem
	@kind radio-group
	@layer components

	Individual radio button — role="radio", aria-checked.
	MeltUI transport provides all ARIA and keyboard handling via item(value).
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getRadioGroupContext } from "./context.js";
import { radioGroupRecipe } from "./recipe.js";
import type { RadioGroupItemProps } from "./types.js";

let { value, children, class: className, ...rest }: RadioGroupItemProps = $props();

const transport = getRadioGroupContext();
const recipe = radioGroupRecipe();
</script>

<button
	{...transport.item(value)}
	class={cn(recipe.item, className)}
	data-kind="radio-group"
	data-slot="item"
	{...rest}
>
	{@render children?.()}
</button>
