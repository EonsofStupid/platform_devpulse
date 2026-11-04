<!--
	@component DropdownMenuLabel
	@kind dropdown-menu
	@slot group-label
	@layer components

	Label for a group of menu items. Non-interactive.
-->
<script lang="ts">
import { dropdownMenuAnatomy } from "#coldlight/behaviors/navigation/dropdown-menu/index.js";
import type { DropdownMenuLabelProps } from "./types.js";

let { children, ...rest }: DropdownMenuLabelProps = $props();
</script>

<div {...dropdownMenuAnatomy.attrs["group-label"]} {...rest}>
	{@render children?.()}
</div>
