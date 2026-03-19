<!--
	@component DropdownMenuGroup
	@kind dropdown-menu
	@slot group
	@layer components

	Groups related menu items with optional label.
	ARIA: role="group".
-->
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
import { dropdownMenuRecipe } from "./recipe.js";
import type { DropdownMenuGroupProps } from "./types.js";

let { children, class: className, ...rest }: DropdownMenuGroupProps = $props();

const recipe = dropdownMenuRecipe();
</script>

<div
	role="group"
	class={cn(recipe.group, className)}
	data-kind="dropdown-menu"
	data-slot="group"
	{...rest}
>
	{@render children?.()}
</div>
