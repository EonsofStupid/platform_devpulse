<!--
	@component SelectContent
	@kind select
	@layer components

	Select content — the dropdown listbox container.
	Only visible when open state is true.
	MeltUI transport provides role="listbox", ARIA attributes.
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { getSelectContext } from "./context.js";
import { selectComposition } from "./composition.js";
import type { SelectContentProps } from "./types.js";

let { children, class: className, ...rest }: SelectContentProps = $props();

const transport = getSelectContext();
const composition = selectComposition();
</script>

{#if transport.states.open}
	<div
		{...transport.slots.content}
		class={cn(composition.content, className)}
		data-kind="select"
		data-slot="content"
		data-state="open"
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
