<!--
	@component Select.Trigger
	@kind select
	@slot trigger
	@layer components

	Opens/closes the listbox. ARIA from hook via context.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import type { SelectTriggerProps } from "./types.js";

let { children, class: className, ...rest }: SelectTriggerProps = $props();
const ctx = getSelectContext();
</script>

<button
	{...ctx.hook.trigger}
	data-kind="select"
	data-slot="trigger"
	class={cn(
		"inline-flex items-center justify-between w-full rounded-md border px-3 py-2 text-sm",
		"focus-visible:outline-2 focus-visible:outline-offset-2",
		className)}
	{...rest}
>
	{#if children}
		{@render children()}
	{:else}
		<span {...ctx.hook.valueDisplay}>
			{ctx.hook.value || ctx.placeholder || "Select..."}
		</span>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
			stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
			class="size-4 shrink-0 opacity-50" aria-hidden="true">
			<path d="m6 9 6 6 6-6" />
		</svg>
	{/if}
</button>
