<!--
	@component DropdownMenuSeparator
	@kind dropdown-menu
	@slot separator
	@layer components

	Visual and semantic separator between menu items.
	ARIA: role="separator".
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import { mergeProps } from "#coldlight/utils/merge-props.js";
import { getDropdownMenuContext } from "./context.js";
import type { DropdownMenuSeparatorProps } from "./types.js";

let { ...rest }: DropdownMenuSeparatorProps = $props();

const ctx = getDropdownMenuContext();
const attrs = $derived(mergeProps(ctx.hook.separator, dropdownMenuAnatomy.attrs.separator, rest));
</script>

<div {...attrs}></div>
