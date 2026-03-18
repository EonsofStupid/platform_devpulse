<!--
	@component DropdownMenuSeparator
	@kind dropdown-menu
	@slot separator
	@layer components

	Visual and semantic separator between menu items.
	ARIA: role="separator".
-->
<script lang="ts">
import { cn } from "$lib/design/primitives/types.js";
import { dropdownMenuRecipe } from "./recipe.js";
import type { DropdownMenuSeparatorProps } from "./types.js";

let { class: className, ...rest }: DropdownMenuSeparatorProps = $props();

const recipe = dropdownMenuRecipe();
</script>

<div
	role="separator"
	class={cn(recipe.separator, className)}
	data-kind="dropdown-menu"
	data-slot="separator"
	{...rest}
></div>
