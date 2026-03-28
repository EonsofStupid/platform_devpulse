<!--
	@component Combobox.Trigger
	@kind combobox
	@slot trigger
	@layer components

	Toggle button — opens/closes the listbox dropdown.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getComboboxContext } from "./context.js";
import type { ComboboxTriggerProps } from "./types.js";

let {
	children,
	class: className,
	"aria-label": ariaLabel = "Toggle options",
}: ComboboxTriggerProps = $props();
const ctx = getComboboxContext();
</script>

<button
	{...ctx.hook.trigger}
	class={cn(className)}
	data-state={ctx.hook.open ? "open" : "closed"}
	aria-label={ariaLabel}
>
	{#if children}
		{@render children()}
	{:else}
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-3xs" aria-hidden="true">
			<path d="m6 9 6 6 6-6" />
		</svg>
	{/if}
</button>
