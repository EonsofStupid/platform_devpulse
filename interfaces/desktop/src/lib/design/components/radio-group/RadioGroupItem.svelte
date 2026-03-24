<!--
	@component RadioGroup.Item
	@kind radio-group
	@slot item
	@layer components

	Individual radio button. ARIA from hook.getRadio(value).
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getRadioGroupContext } from "./context.js";
import type { RadioGroupItemProps } from "./types.js";

let { value, disabled = false, children, class: className, ...rest }: RadioGroupItemProps = $props();
const ctx = getRadioGroupContext();

const radioAttrs = $derived(ctx.hook.getRadio(value, disabled));
</script>

<button
	{...radioAttrs}
	data-kind="radio-group"
	data-slot="item"
	class={cn(
		"inline-flex items-center justify-center size-5 rounded-full border-2 cursor-pointer",
		"focus-visible:outline-2 focus-visible:outline-offset-2",
		"disabled:pointer-events-none disabled:opacity-50",
		className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else if radioAttrs["aria-checked"]}
		<span data-kind="radio-group" data-slot="indicator" class="size-2.5 rounded-full"></span>
	{/if}
</button>
