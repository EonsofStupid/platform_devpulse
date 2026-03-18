<!--
	@component ContextMenuTrigger
	@kind context-menu
	@slot trigger
	@layer components

	Right-click zone that opens the context menu.
	No ARIA role on the trigger — it is a plain container that intercepts contextmenu event.
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { getContextMenuContext } from "./context.js";
import { contextMenuRecipe } from "./recipe.js";
import type { ContextMenuTriggerProps } from "./types.js";

let { children, class: className, ...rest }: ContextMenuTriggerProps = $props();

const ctx = getContextMenuContext();
const recipe = contextMenuRecipe();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	oncontextmenu={(e) => {
		e.preventDefault();
		ctx.position.x = e.clientX;
		ctx.position.y = e.clientY;
		if (!ctx.open) {
			// Need to trigger open through parent binding
		}
	}}
	class={cn(recipe.trigger, className)}
	data-kind="context-menu"
	data-slot="trigger"
	data-state={ctx.open ? "open" : "closed"}
	{...rest}
>
	{@render children?.()}
</div>
