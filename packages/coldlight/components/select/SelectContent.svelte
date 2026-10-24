<!--
	@component Select.Content
	@kind select
	@slot content
	@layer components

	Dropdown listbox container. Visible when open. ARIA from hook via context.
-->
<script lang="ts">
import { cn } from "#coldlight/utils/cn.js";
import { getSelectContext } from "./context.js";
import type { SelectContentProps } from "./types.js";

let { children, class: className, ...rest }: SelectContentProps = $props();
const ctx = getSelectContext();
</script>

{#if ctx.hook.open}
	<div
		{...ctx.hook.listbox}
		use:ctx.hook.attachListbox
		data-kind="select"
		data-slot="content"
		data-state="open"
		class={cn(
			"absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1",
			className)}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
