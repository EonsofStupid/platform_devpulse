<!--
	@component DropdownMenuContent
	@kind dropdown-menu
	@slot content
	@layer components

	Menu content container — visible when open.
	ARIA: role="menu", aria-labelledby → trigger. Escape, outside press and arrow keys
	from the behavior. Its look is dropdown-menu.tokens.json's generated CSS.
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import { styleAttrs } from "#coldlight/renderforge/index.js";
import { cn } from "#coldlight/utils/cn.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getDropdownMenuContext } from "./context.js";
import { DROPDOWN_MENU_DEFAULTS } from "./dropdown-menu.generated.js";
import type { DropdownMenuContentProps } from "./types.js";

const SIDE = {
	bottom: "top-full mt-1",
	top: "bottom-full mb-1",
	right: "left-full ml-1",
	left: "right-full mr-1",
} as const;

const ALIGN_BLOCK = {
	start: "left-0",
	center: "left-1/2 -translate-x-1/2",
	end: "right-0",
} as const;

const ALIGN_INLINE = {
	start: "top-0",
	center: "top-1/2 -translate-y-1/2",
	end: "bottom-0",
} as const;

let {
	children,
	variant = DROPDOWN_MENU_DEFAULTS.variant,
	surface,
	size = DROPDOWN_MENU_DEFAULTS.size,
	side = "bottom",
	align = "start",
	class: className,
	...rest
}: DropdownMenuContentProps = $props();

const ctx = getDropdownMenuContext();

const attrs = $derived(mergeProps(ctx.hook.content, dropdownMenuAnatomy.attrs.content, rest));
const placement = $derived(
	cn(SIDE[side], side === "top" || side === "bottom" ? ALIGN_BLOCK[align] : ALIGN_INLINE[align]),
);
</script>

{#if ctx.hook.open}
	<div
		{...attrs}
		use:ctx.hook.attachContent
		{...styleAttrs({ kind: "dropdown-menu", variant, size, surface })}
		data-slot="content"
		data-side={side}
		data-align={align}
		class={cn("absolute z-50 overflow-hidden", placement, className)}
	>
		{@render children?.()}
	</div>
{/if}
