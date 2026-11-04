<!--
	@component DropdownMenuTrigger
	@kind dropdown-menu
	@slot trigger
	@layer components

	Button that opens/closes the dropdown menu.
	ARIA: aria-haspopup="menu", aria-expanded, aria-controls, from the behavior.
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getDropdownMenuContext } from "./context.js";
import type { DropdownMenuTriggerProps } from "./types.js";

let { children, ...rest }: DropdownMenuTriggerProps = $props();

const ctx = getDropdownMenuContext();
const attrs = $derived(mergeProps(ctx.hook.trigger, dropdownMenuAnatomy.attrs.trigger, rest));
</script>

<button {...attrs}>
	{@render children?.()}
</button>
