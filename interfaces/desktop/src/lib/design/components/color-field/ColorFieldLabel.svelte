<!--
	@component ColorField.Label
	@kind color-field
	@slot label
	@layer components
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getColorFieldContext } from "./context.js";
import type { ColorFieldLabelProps } from "./types.js";

let { children, class: className, ...rest }: ColorFieldLabelProps = $props();
const ctx = getColorFieldContext();
</script>

<label
	id={ctx.ids.label}
	for={ctx.ids.input}
	data-kind="color-field"
	data-slot="label"
	class={cn(className)}
	{...rest}
>
	{@render children?.()}
	{#if ctx.isRequired}
		<span aria-hidden="true" class={}>*</span>
	{/if}
</label>
