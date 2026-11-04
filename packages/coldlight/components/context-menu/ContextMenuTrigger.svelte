<!--
	@component ContextMenuTrigger
	@kind context-menu
	@slot trigger
	@layer components

	Right-click zone that opens the context menu.
	No ARIA role on the trigger — it is a plain container that intercepts the contextmenu event.
-->
<script lang="ts">
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getContextMenuContext } from "./context.js";
import type { ContextMenuTriggerProps } from "./types.js";

let { children, ...rest }: ContextMenuTriggerProps = $props();

const ctx = getContextMenuContext();
const attrs = $derived(mergeProps(ctx.hook.trigger, rest));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div {...attrs}>
	{@render children?.()}
</div>
