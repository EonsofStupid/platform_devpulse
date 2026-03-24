<!--
	@component ColorField.Description
	@kind color-field
	@slot description
	@layer components

	Registers itself in context so Input can conditionally add aria-describedby.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getColorFieldContext } from "./context.js";
import type { ColorFieldDescriptionProps } from "./types.js";

let { children, class: className, ...rest }: ColorFieldDescriptionProps = $props();
const ctx = getColorFieldContext();

// Register that this slot exists — Input uses this for aria-describedby
ctx.registerDescription();
</script>

<p
	id={ctx.ids.description}
	data-kind="color-field"
	data-slot="description"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
</p>
