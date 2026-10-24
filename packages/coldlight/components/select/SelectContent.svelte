<!--
	@component Select.Content
	@kind select
	@slot content
	@layer components

	Dropdown listbox container. Visible when open. ARIA from hook via context.
	Its surface is the kind file's (select.tokens.json): a surface role read
	from the family in scope, elevated by default, like Popover's panel.
-->
<script lang="ts">
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { getSelectContext } from "./context.js";
import { SELECT_DEFAULTS } from "./select.generated.js";
import type { SelectContentProps } from "./types.js";

let {
	variant = SELECT_DEFAULTS.variant,
	surface,
	children,
	class: className,
	...rest
}: SelectContentProps = $props();
const ctx = getSelectContext();
</script>

{#if ctx.hook.open}
	<div
		{...ctx.hook.listbox}
		use:ctx.hook.attachListbox
		{...styleAttrs({ kind: "select", variant, surface })}
		data-slot="content"
		data-state="open"
		class={cn("absolute z-50 mt-1 max-h-60 w-full overflow-auto py-1", className)}
		{...rest}
	>
		{@render children?.()}
	</div>
{/if}
